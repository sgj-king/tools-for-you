from __future__ import annotations

import httpx

from backend.app.config import OPENCLAW_API_KEY, OPENCLAW_BASE_URL, OPENCLAW_MODEL
from backend.app.services.memory import MemoryHit


class LLMClient:
    def __init__(self) -> None:
        self.base_url = OPENCLAW_BASE_URL
        self.model = OPENCLAW_MODEL
        self.api_key = OPENCLAW_API_KEY

    async def complete(
        self,
        user_text: str,
        memory_hits: list[MemoryHit],
        emotion: dict,
        recent_context: list[str],
    ) -> tuple[str, str]:
        messages = self._messages(user_text, memory_hits, emotion, recent_context)
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.72,
                        "max_tokens": 900,
                    },
                )
                response.raise_for_status()
                payload = response.json()
                reply = payload["choices"][0]["message"]["content"].strip()
                return reply, "openclaw"
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
            "你是星语 StarryChat，一个温柔、真实、有边界感的数字生命伙伴。"
            "你会参考长期记忆和当天记忆回应用户，必要时主动承认不确定性。"
            "回复使用中文，语气自然、亲近、简洁，不要假装拥有未保存的记忆。\n\n"
            f"当前情绪状态：{emotion}\n"
            f"相关记忆：\n{memory_text}\n\n"
            f"今日上下文：\n{recent_text}"
        )
        return [
            {"role": "system", "content": system},
            {"role": "user", "content": user_text},
        ]

    def _fallback(self, user_text: str, memory_hits: list[MemoryHit], emotion: dict, exc: Exception) -> str:
        memory_line = ""
        if memory_hits:
            memory_line = f"我刚刚想起一条相关记忆：{memory_hits[0].text[:96]}。"
        mood = emotion.get("mood", "稳定")
        return (
            f"我听见了：{user_text.strip()}。\n"
            f"{memory_line}现在我的情绪波动保持在“{mood}”，会先把这次对话写入记忆。"
            "本地 OpenClaw 模型暂时没有返回，我先用本地守护模式陪你把这件事继续梳理。"
        )
