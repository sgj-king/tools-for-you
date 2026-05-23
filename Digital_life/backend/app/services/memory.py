from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from backend.app.config import WORKSPACE_DIR


@dataclass
class MemoryHit:
    source: str
    text: str
    score: float


class MemoryStore:
    def __init__(self, user_id: str | None = None) -> None:
        self.user_id = self._sanitize_user_id(user_id or "_anonymous")
        self.user_dir = WORKSPACE_DIR / "users" / self.user_id
        self.memory_file = self.user_dir / "MEMORY.md"
        self.daily_dir = self.user_dir / "memory"
        self.state_file = self.user_dir / "memory_state.json"
        self._migrate_legacy_data()
        self.ensure()

    @staticmethod
    def _sanitize_user_id(user_id: str) -> str:
        safe = re.sub(r"[^\w\-]", "_", user_id)
        return safe[:64] if safe else "_anonymous"

    def _migrate_legacy_data(self) -> None:
        """Migrate old root-level data to users/_legacy/ once"""
        legacy_memory = WORKSPACE_DIR / "MEMORY.md"
        legacy_daily = WORKSPACE_DIR / "memory"
        legacy_state = WORKSPACE_DIR / "memory_state.json"
        legacy_emotion = WORKSPACE_DIR / "emotion_state.json"

        if not any(p.exists() for p in [legacy_memory, legacy_daily, legacy_state, legacy_emotion]):
            return

        legacy_dir = WORKSPACE_DIR / "users" / "_legacy"
        legacy_dir.mkdir(parents=True, exist_ok=True)

        if legacy_memory.exists() and not (legacy_dir / "MEMORY.md").exists():
            legacy_memory.rename(legacy_dir / "MEMORY.md")
        if legacy_daily.exists() and legacy_daily.is_dir() and not (legacy_dir / "memory").exists():
            legacy_daily.rename(legacy_dir / "memory")
        if legacy_state.exists() and not (legacy_dir / "memory_state.json").exists():
            legacy_state.rename(legacy_dir / "memory_state.json")
        if legacy_emotion.exists() and not (legacy_dir / "emotion_state.json").exists():
            legacy_emotion.rename(legacy_dir / "emotion_state.json")

    def ensure(self) -> None:
        self.daily_dir.mkdir(parents=True, exist_ok=True)
        if not self.memory_file.exists():
            self.memory_file.write_text(
                "# StarryChat Long-Term Memory\n\n"
                "Durable user preferences, identity details, commitments, and relationship summaries live here.\n",
                encoding="utf-8",
            )
        if not self.state_file.exists():
            self.state_file.write_text(
                json.dumps(
                    {
                        "first_meet": datetime.now().strftime("%Y.%m.%d"),
                        "topics": {},
                        "good_phrases": 0,
                        "focus_tag": "未设置",
                        "turns": 0,
                    },
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8",
            )

    def _today_file(self) -> Path:
        return self.daily_dir / f"{datetime.now().date().isoformat()}.md"

    def _load_state(self) -> dict:
        self.ensure()
        return json.loads(self.state_file.read_text(encoding="utf-8"))

    def _save_state(self, state: dict) -> None:
        self.state_file.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    def append_daily(self, role: str, text: str) -> None:
        self.ensure()
        now = datetime.now().strftime("%H:%M:%S")
        safe = text.strip().replace("\n", "\n  ")
        with self._today_file().open("a", encoding="utf-8") as f:
            if f.tell() == 0:
                f.write(f"# {datetime.now().date().isoformat()} Daily Memory\n\n")
            f.write(f"- {now} **{role}:** {safe}\n")

    def remember(self, text: str, source: str = "manual") -> str:
        self.ensure()
        stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        entry = f"\n## {stamp} ({source})\n\n- {text.strip()}\n"
        with self.memory_file.open("a", encoding="utf-8") as f:
            f.write(entry)
        return entry.strip()

    def capture_turn(self, user_text: str, assistant_text: str) -> None:
        self.append_daily("user", user_text)
        self.append_daily("assistant", assistant_text)
        state = self._load_state()
        state["turns"] = int(state.get("turns", 0)) + 1
        for topic in self._extract_topics(user_text):
            state["topics"][topic] = int(state["topics"].get(topic, 0)) + 1
        if any(word in assistant_text for word in ["喜欢", "愿意", "陪", "安心", "星语"]):
            state["good_phrases"] = int(state.get("good_phrases", 0)) + 1
        if state.get("topics"):
            state["focus_tag"] = max(state["topics"].items(), key=lambda item: item[1])[0]
        self._save_state(state)

        if self._should_promote(user_text):
            self.remember(user_text, "auto-capture")

    def search(self, query: str, top_k: int = 5) -> list[MemoryHit]:
        query_tokens = set(self._tokens(query))
        if not query_tokens and not query.strip():
            return []

        hits: list[MemoryHit] = []
        for path in self._memory_files():
            chunks = self._chunks(path.read_text(encoding="utf-8", errors="ignore"))
            for chunk in chunks:
                score = self._score(query, query_tokens, chunk)
                if score > 0:
                    hits.append(MemoryHit(source=str(path.relative_to(self.user_dir)), text=chunk, score=score))
        hits.sort(key=lambda hit: hit.score, reverse=True)
        return hits[:top_k]

    def stats(self) -> dict:
        state = self._load_state()
        memory_text = self.memory_file.read_text(encoding="utf-8", errors="ignore")
        daily_files = sorted(self.daily_dir.glob("*.md"))
        memory_count = len(re.findall(r"^- ", memory_text, flags=re.MULTILINE))
        topics = sorted(state.get("topics", {}).items(), key=lambda item: item[1], reverse=True)
        return {
            "first_meet": state.get("first_meet", datetime.now().strftime("%Y.%m.%d")),
            "shared_topics": sum(count for _, count in topics),
            "good_phrases": state.get("good_phrases", 0),
            "focus_tag": state.get("focus_tag", "未设置"),
            "turns": state.get("turns", 0),
            "memory_count": memory_count,
            "daily_files": len(daily_files),
            "top_topics": [{"name": name, "count": count} for name, count in topics[:5]],
        }

    def recent_context(self, limit: int = 8) -> list[str]:
        path = self._today_file()
        if not path.exists():
            return []
        lines = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.startswith("- ")]
        return lines[-limit:]

    def _memory_files(self) -> Iterable[Path]:
        yield self.memory_file
        for path in sorted(self.daily_dir.glob("*.md"), reverse=True)[:14]:
            yield path

    def _chunks(self, text: str) -> list[str]:
        raw = re.split(r"\n(?=## |- \d{2}:|\- )", text)
        chunks = []
        for item in raw:
            compact = re.sub(r"\n{2,}", "\n", item.strip())
            if len(compact) > 16:
                chunks.append(compact[:900])
        return chunks

    def _score(self, query: str, query_tokens: set[str], text: str) -> float:
        lowered = text.lower()
        tokens = set(self._tokens(text))
        overlap = len(query_tokens & tokens)
        substring = 2.0 if query.strip() and query.lower() in lowered else 0.0
        return overlap + substring + min(len(query_tokens & tokens) / 10, 1)

    def _tokens(self, text: str) -> list[str]:
        return re.findall(r"[\u4e00-\u9fff]|[a-zA-Z0-9_]{2,}", text.lower())

    def _should_promote(self, text: str) -> bool:
        patterns = [
            r"记住",
            r"remember",
            r"我的名字",
            r"我叫",
            r"我喜欢",
            r"我不喜欢",
            r"以后.*(希望|请|要)",
            r"偏好",
            r"重要",
        ]
        return any(re.search(pattern, text, flags=re.I) for pattern in patterns)

    def _extract_topics(self, text: str) -> list[str]:
        known = {
            "数字生命": ["数字生命", "伴侣", "生命"],
            "OpenClaw": ["openclaw", "本地模型", "LLM"],
            "记忆": ["记忆", "回忆", "remember"],
            "语音": ["语音", "TTS", "说话", "声音"],
            "情绪": ["情绪", "心情", "开心", "难过"],
            "界面": ["界面", "网页", "设计", "面板"],
        }
        found = []
        lowered = text.lower()
        for name, aliases in known.items():
            if any(alias.lower() in lowered for alias in aliases):
                found.append(name)
        return found or ["日常对话"]
