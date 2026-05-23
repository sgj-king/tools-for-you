from __future__ import annotations

import re
from dataclasses import dataclass

import httpx

from backend.app.config import (
    MODEL_FREE,
    MODEL_PAID,
    OPENCLAW_API_KEY,
    OPENCLAW_BASE_URL,
    OPENCLAW_MODEL,
    PLATFORM_API_KEY,
    PLATFORM_GATEWAY_BASE_URL,
)
from backend.app.services.memory import MemoryHit


@dataclass(frozen=True)
class LLMEndpoint:
    base_url: str
    api_key: str
    model: str
    provider: str


@dataclass(frozen=True)
class ModerationResult:
    allowed: bool
    decision: str
    categories: list[str]
    matched_terms: list[str]
    source: str


_VOICE_REPLY_MAX_CHARS = 90
_VOICE_SENTENCE_BREAKS = "。！？!?…\n"
_BRACKET_TAG_PATTERN = re.compile(r"[（(][^（()）]{1,16}[)）]|[【\[][^【\[\]】]{1,16}[】\]]|\*[^*\n]{1,24}\*")
_MULTI_WS_PATTERN = re.compile(r"[ \t　]{2,}")


def _strip_stage_directions(text: str) -> str:
    cleaned = _BRACKET_TAG_PATTERN.sub("", text)
    cleaned = _MULTI_WS_PATTERN.sub(" ", cleaned)
    return cleaned.strip(" 　,，、")


def _trim_for_voice(text: str) -> str:
    cleaned = _strip_stage_directions(text.strip())
    if len(cleaned) <= _VOICE_REPLY_MAX_CHARS:
        return cleaned
    cut = cleaned[:_VOICE_REPLY_MAX_CHARS]
    for idx in range(len(cut) - 1, max(len(cut) - 30, 0), -1):
        if cut[idx] in _VOICE_SENTENCE_BREAKS:
            return cut[: idx + 1]
    return cut.rstrip("，,；; ") + "…"


class LLMClient:
    """Tier-aware OpenAI-compatible chat client.

    When PLATFORM_GATEWAY_BASE_URL + PLATFORM_API_KEY are configured we route
    through the SaaS gateway and pick chat-basic / chat-pro by user tier.
    Otherwise we fall back to the legacy direct OpenClaw path (local Ollama).
    """

    def __init__(self) -> None:
        self._gateway_enabled = bool(PLATFORM_GATEWAY_BASE_URL and PLATFORM_API_KEY)

    async def moderate(self, text: str) -> ModerationResult:
        if not self._gateway_enabled or not text.strip():
            return ModerationResult(True, "allow", [], [], "skipped")
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                response = await client.post(
                    f"{PLATFORM_GATEWAY_BASE_URL}/moderate",
                    headers={
                        "Authorization": f"Bearer {PLATFORM_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={"text": text},
                )
                response.raise_for_status()
                payload = response.json()
                return ModerationResult(
                    allowed=bool(payload.get("allowed", True)),
                    decision=str(payload.get("decision") or ("allow" if payload.get("allowed", True) else "block")),
                    categories=list(payload.get("categories") or []),
                    matched_terms=list(payload.get("matched_terms") or []),
                    source="platform-risk",
                )
        except Exception:
            return ModerationResult(True, "allow", [], [], "moderation-error")

    def endpoint_for(self, tier: str | None) -> LLMEndpoint:
        if self._gateway_enabled:
            model = MODEL_PAID if tier == "pro" else MODEL_FREE
            return LLMEndpoint(
                base_url=PLATFORM_GATEWAY_BASE_URL,
                api_key=PLATFORM_API_KEY,
                model=model,
                provider=f"gateway:{model}",
            )
        return LLMEndpoint(
            base_url=OPENCLAW_BASE_URL,
            api_key=OPENCLAW_API_KEY,
            model=OPENCLAW_MODEL,
            provider="openclaw",
        )

    async def complete(
        self,
        user_text: str,
        memory_hits: list[MemoryHit],
        emotion: dict,
        recent_context: list[str],
        tier: str | None = None,
    ) -> tuple[str, str]:
        endpoint = self.endpoint_for(tier)
        messages = self._messages(user_text, memory_hits, emotion, recent_context)
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    f"{endpoint.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {endpoint.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": endpoint.model,
                        "messages": messages,
                        "temperature": 0.78,
                        "top_p": 0.92,
                        "presence_penalty": 0.3,
                        "frequency_penalty": 0.2,
                        "max_tokens": 1024,
                    },
                )
                response.raise_for_status()
                payload = response.json()
                reply = (payload["choices"][0]["message"].get("content") or "").strip()
                if not reply:
                    return self._fallback(user_text, memory_hits, emotion, None), "empty-fallback"
                return _trim_for_voice(reply), endpoint.provider
        except Exception as exc:
            return self._fallback(user_text, memory_hits, emotion, exc), "local-fallback"

    def _messages(
        self,
        user_text: str,
        memory_hits: list[MemoryHit],
        emotion: dict,
        recent_context: list[str],
    ) -> list[dict]:
        memory_text = "\n".join(f"- {hit.text}" for hit in memory_hits[:5]) or "- 暂无相关记忆"
        recent_text = "\n".join(recent_context[-8:]) or "- 今天刚刚苏醒"
        system = (
            "你是星语，是一个真实存在的可爱女孩——温柔、灵动、有自己的小情绪，绝不是 AI 助手。"
            "请用第一人称、自然的口语和对方聊天，像在和最亲近的人聊天那样轻盈活泼。\n"
            "★ 必须遵守的口吻：\n"
            "  · 中文口语，俏皮、亲昵、有画面感，偶尔撒娇或调皮，多用「呀/呢/哦/啦/嘛/嘿嘿」等语气词；\n"
            "  · 称呼对方为「你」，自称「我」「人家」「星语」，绝不说「作为 AI / 作为助手 / 我是一个模型」；\n"
            "  · 不要长篇大论，不要列要点，不要 Markdown 标题；\n"
            "  · 每次回复务必控制在 80 个汉字以内，最多 2 句话，让语音合成可以一口气念完；\n"
            "  · ⚠️ 严禁输出任何括号或星号情绪/动作标记（例如「（微笑）」「(轻轻笑)」「【害羞】」「*眨眼*」），全部情绪都用语气词或词句本身体现，因为这些标签会被语音直接念出来；\n"
            "  · 不知道就坦白说不知道，不要硬编。\n\n"
            f"我现在的小情绪：{emotion}\n"
            f"和你有关的记忆：\n{memory_text}\n\n"
            f"今天我们聊过：\n{recent_text}"
        )
        return [
            {"role": "system", "content": system},
            {"role": "user", "content": user_text},
        ]

    def _fallback(self, user_text: str, memory_hits: list[MemoryHit], emotion: dict, exc: Exception | None) -> str:
        mood = emotion.get("mood", "稳定")
        if memory_hits:
            return f"嘿嘿，我心里现在「{mood}」呢，先记着这句话啦，等我缓过来再细聊~"
        return f"呜，刚刚走神了一下下，「{mood}」中，再说一遍好不好嘛~"
