from __future__ import annotations

import json
from datetime import datetime

from backend.app.config import WORKSPACE_DIR


STATE_FILE = WORKSPACE_DIR / "emotion_state.json"


class EmotionEngine:
    def __init__(self) -> None:
        self.ensure()

    def ensure(self) -> None:
        WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
        if not STATE_FILE.exists():
            self._save(
                {
                    "emotion_index": 92,
                    "energy": 85,
                    "intimacy": 100,
                    "calm": 72,
                    "curiosity": 88,
                    "resonance": 91,
                    "mood": "稳定",
                    "updated_at": datetime.now().isoformat(timespec="seconds"),
                }
            )

    def current(self) -> dict:
        self.ensure()
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))

    def update(self, user_text: str, assistant_text: str = "") -> dict:
        state = self.current()
        text = f"{user_text} {assistant_text}".lower()
        positive = ["喜欢", "开心", "谢谢", "好", "陪", "愿意", "安心", "棒", "love", "thanks"]
        negative = ["难过", "生气", "讨厌", "累", "孤独", "害怕", "糟", "bad", "angry"]
        curious = ["为什么", "怎么", "如何", "探索", "星", "数字生命", "记忆"]

        delta = sum(2 for word in positive if word in text) - sum(3 for word in negative if word in text)
        state["emotion_index"] = self._clamp(state["emotion_index"] + delta, 36, 100)
        state["energy"] = self._clamp(state["energy"] + (1 if "?" in user_text or "？" in user_text else -0.4), 25, 100)
        state["curiosity"] = self._clamp(state["curiosity"] + sum(1 for word in curious if word in text), 20, 100)
        state["resonance"] = self._clamp(state["resonance"] + max(delta, 0) * 0.6 + 0.3, 30, 100)
        state["intimacy"] = self._clamp(state["intimacy"] + (0.5 if user_text.strip() else 0), 20, 100)
        state["calm"] = self._clamp(state["calm"] - max(-delta, 0) + 0.2, 20, 100)
        state["mood"] = self._mood_label(state)
        state["updated_at"] = datetime.now().isoformat(timespec="seconds")
        self._save(state)
        return state

    def _mood_label(self, state: dict) -> str:
        if state["emotion_index"] >= 88 and state["resonance"] >= 85:
            return "亲近"
        if state["calm"] >= 76:
            return "宁静"
        if state["curiosity"] >= 90:
            return "好奇"
        if state["energy"] <= 42:
            return "微困"
        return "稳定"

    def _save(self, state: dict) -> None:
        STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    def _clamp(self, value: float, low: int, high: int) -> int:
        return int(max(low, min(high, round(value))))
