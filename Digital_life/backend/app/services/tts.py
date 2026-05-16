from __future__ import annotations

import httpx

from backend.app.config import FREETTS_BASE_URL, TTS_BASE_URL, TTS_DEFAULT_VOICE, TTS_TIMEOUT_SECONDS


class TTSClient:
    async def synthesize(self, text: str, voice: str | None = None, speed: float = 1.0, fmt: str = "mp3") -> bytes:
        cleaned = text.strip()
        if not cleaned:
            raise ValueError("text is required")
        errors: list[str] = []
        for provider in (self._freetts, self._ttsfm, self._google_translate):
            try:
                audio = await provider(cleaned, voice or TTS_DEFAULT_VOICE, speed, fmt)
                if audio:
                    return audio
            except Exception as exc:
                errors.append(f"{provider.__name__}: {exc}")
        raise RuntimeError("; ".join(errors))

    async def _freetts(self, text: str, voice: str, speed: float, fmt: str) -> bytes:
        mapped_voice = self._edge_voice(voice, text)
        rate = int(round((speed - 1.0) * 100))
        async with httpx.AsyncClient(timeout=TTS_TIMEOUT_SECONDS, follow_redirects=True) as client:
            created = await client.post(
                f"{FREETTS_BASE_URL}/tts",
                headers={"Content-Type": "application/json"},
                json={
                    "text": text[:1000],
                    "voice": mapped_voice,
                    "rate": f"{rate:+d}%",
                    "pitch": "+0Hz",
                },
            )
            created.raise_for_status()
            payload = created.json()
            file_id = payload.get("file_id") or payload.get("id")
            if not file_id:
                raise RuntimeError(f"missing file_id: {payload}")
            audio = await client.get(f"{FREETTS_BASE_URL}/audio/{file_id}")
            audio.raise_for_status()
            return audio.content

    async def _ttsfm(self, text: str, voice: str, speed: float, fmt: str) -> bytes:
        payload = {
            "model": "tts-1",
            "input": text[:1800],
            "voice": voice,
            "response_format": fmt,
            "speed": speed,
        }
        async with httpx.AsyncClient(timeout=TTS_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{TTS_BASE_URL}/v1/audio/speech",
                headers={"Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
            return response.content

    async def _google_translate(self, text: str, voice: str, speed: float, fmt: str) -> bytes:
        lang = "zh-CN" if self._has_cjk(text) else "en"
        async with httpx.AsyncClient(timeout=TTS_TIMEOUT_SECONDS, follow_redirects=True) as client:
            response = await client.get(
                "https://translate.google.com/translate_tts",
                params={"ie": "UTF-8", "client": "tw-ob", "tl": lang, "q": text[:200]},
                headers={"User-Agent": "Mozilla/5.0 StarryChat/1.0"},
            )
            response.raise_for_status()
            return response.content

    def _edge_voice(self, voice: str, text: str) -> str:
        if "-" in voice and voice.endswith("Neural"):
            return voice
        if self._has_cjk(text):
            return "zh-CN-XiaoxiaoNeural"
        return {
            "nova": "en-US-JennyNeural",
            "alloy": "en-US-AriaNeural",
            "echo": "en-US-GuyNeural",
            "fable": "en-GB-SoniaNeural",
            "onyx": "en-US-DavisNeural",
            "shimmer": "en-US-JaneNeural",
        }.get(voice, "en-US-JennyNeural")

    def _has_cjk(self, text: str) -> bool:
        return any("\u4e00" <= char <= "\u9fff" for char in text)
