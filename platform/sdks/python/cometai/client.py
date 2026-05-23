from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, AsyncIterator, Iterable, Iterator

import httpx


DEFAULT_TIMEOUT = 60.0


class CometError(Exception):
    def __init__(self, message: str, *, status_code: int | None = None, error_code: str | None = None, request_id: str | None = None, trace_id: str | None = None, payload: Any = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code
        self.request_id = request_id
        self.trace_id = trace_id
        self.payload = payload

    def __repr__(self) -> str:
        return f"CometError(status={self.status_code}, code={self.error_code!r}, message={str(self)!r})"


@dataclass(frozen=True)
class ChatCompletion:
    id: str
    model: str
    content: str
    finish_reason: str | None
    usage: dict[str, Any]
    request_id: str | None
    trace_id: str | None
    raw: dict[str, Any]


@dataclass(frozen=True)
class ModerationResult:
    allowed: bool
    decision: str
    categories: list[str]
    matched_terms: list[str]
    request_id: str | None
    trace_id: str | None
    raw: dict[str, Any]


def _extract_choice(payload: dict[str, Any]) -> tuple[str, str | None]:
    choices = payload.get("choices") or []
    if not choices:
        return "", None
    first = choices[0] or {}
    message = first.get("message") or {}
    return str(message.get("content") or ""), first.get("finish_reason")


def _raise_for_error(response: httpx.Response, body: dict[str, Any] | None = None) -> None:
    if response.status_code < 400:
        return
    payload = body
    if payload is None:
        try:
            payload = response.json()
        except Exception:
            payload = {"raw": response.text}
    error = (payload or {}).get("error") or payload or {}
    raise CometError(
        message=str(error.get("message") or response.reason_phrase or "request failed"),
        status_code=response.status_code,
        error_code=str(error.get("code") or error.get("error_code") or "http_error"),
        request_id=str((payload or {}).get("request_id") or response.headers.get("X-Request-Id") or ""),
        trace_id=str((payload or {}).get("trace_id") or response.headers.get("X-Trace-Id") or ""),
        payload=payload,
    )


class _Chat:
    def __init__(self, client: "CometClient") -> None:
        self._client = client

    def complete(self, *, model: str, messages: list[dict[str, Any]], max_tokens: int | None = None, temperature: float | None = None, extra: dict[str, Any] | None = None, timeout: float | None = None) -> ChatCompletion:
        body = self._client._chat_body(model, messages, max_tokens, temperature, stream=False, extra=extra)
        response = self._client._post("/chat/completions", body, timeout=timeout)
        payload = response.json()
        _raise_for_error(response, payload)
        content, finish_reason = _extract_choice(payload)
        return ChatCompletion(
            id=str(payload.get("id") or ""),
            model=str(payload.get("model") or model),
            content=content,
            finish_reason=finish_reason,
            usage=dict(payload.get("usage") or {}),
            request_id=str(payload.get("request_id") or response.headers.get("X-Request-Id") or ""),
            trace_id=str(payload.get("trace_id") or response.headers.get("X-Trace-Id") or ""),
            raw=payload,
        )

    def stream(self, *, model: str, messages: list[dict[str, Any]], max_tokens: int | None = None, temperature: float | None = None, extra: dict[str, Any] | None = None, timeout: float | None = None) -> Iterator[str]:
        body = self._client._chat_body(model, messages, max_tokens, temperature, stream=True, extra=extra)
        with self._client._stream("POST", "/chat/completions", body, timeout=timeout) as response:
            if response.status_code >= 400:
                response.read()
                _raise_for_error(response)
            for line in response.iter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    line = line[6:]
                if line == "[DONE]":
                    break
                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError:
                    continue
                delta = ((chunk.get("choices") or [{}])[0].get("delta") or {}).get("content")
                if delta:
                    yield delta


class _Moderation:
    def __init__(self, client: "CometClient") -> None:
        self._client = client

    def check(self, *, text: str | None = None, messages: list[dict[str, Any]] | None = None, timeout: float | None = None) -> ModerationResult:
        if not text and not messages:
            raise ValueError("either text or messages must be provided")
        body: dict[str, Any] = {}
        if text is not None:
            body["text"] = text
        if messages is not None:
            body["messages"] = messages
        response = self._client._post("/moderate", body, timeout=timeout)
        payload = response.json()
        _raise_for_error(response, payload)
        return ModerationResult(
            allowed=bool(payload.get("allowed", True)),
            decision=str(payload.get("decision") or ("allow" if payload.get("allowed", True) else "block")),
            categories=list(payload.get("categories") or []),
            matched_terms=list(payload.get("matched_terms") or []),
            request_id=str(payload.get("request_id") or response.headers.get("X-Request-Id") or ""),
            trace_id=str(payload.get("trace_id") or response.headers.get("X-Trace-Id") or ""),
            raw=payload,
        )


class CometClient:
    """Synchronous client for the Comet AI platform gateway.

    The base_url should point at the gateway's /v1 prefix (e.g.
    ``https://api.your-domain.example.com/v1``). The API key is sent as
    ``Authorization: Bearer <api_key>``.
    """

    def __init__(self, api_key: str | None = None, base_url: str | None = None, *, timeout: float = DEFAULT_TIMEOUT, default_headers: dict[str, str] | None = None, http_client: httpx.Client | None = None) -> None:
        api_key = api_key or os.getenv("COMETAI_API_KEY", "")
        base_url = (base_url or os.getenv("COMETAI_BASE_URL") or "").rstrip("/")
        if not api_key:
            raise CometError("api_key is required (pass api_key or set COMETAI_API_KEY)")
        if not base_url:
            raise CometError("base_url is required (pass base_url or set COMETAI_BASE_URL)")
        self._api_key = api_key
        self._base_url = base_url
        self._timeout = timeout
        self._default_headers = dict(default_headers or {})
        self._client = http_client or httpx.Client(timeout=timeout)
        self.chat = _Chat(self)
        self.moderation = _Moderation(self)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "CometClient":
        return self

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        self.close()

    def _headers(self) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "cometai-python/0.1.0",
        }
        headers.update(self._default_headers)
        return headers

    def _chat_body(self, model: str, messages: list[dict[str, Any]], max_tokens: int | None, temperature: float | None, *, stream: bool, extra: dict[str, Any] | None) -> dict[str, Any]:
        body: dict[str, Any] = {"model": model, "messages": messages, "stream": stream}
        if max_tokens is not None:
            body["max_tokens"] = int(max_tokens)
        if temperature is not None:
            body["temperature"] = float(temperature)
        if extra:
            for key, value in extra.items():
                body[key] = value
        return body

    def _post(self, path: str, body: dict[str, Any], *, timeout: float | None = None) -> httpx.Response:
        return self._client.post(self._base_url + path, json=body, headers=self._headers(), timeout=timeout or self._timeout)

    def _stream(self, method: str, path: str, body: dict[str, Any], *, timeout: float | None = None) -> httpx.Response:
        return self._client.stream(method, self._base_url + path, json=body, headers={**self._headers(), "Accept": "text/event-stream"}, timeout=timeout or self._timeout)


class AsyncCometClient:
    """Async sibling of :class:`CometClient`. Use it with ``async with``."""

    def __init__(self, api_key: str | None = None, base_url: str | None = None, *, timeout: float = DEFAULT_TIMEOUT, default_headers: dict[str, str] | None = None) -> None:
        api_key = api_key or os.getenv("COMETAI_API_KEY", "")
        base_url = (base_url or os.getenv("COMETAI_BASE_URL") or "").rstrip("/")
        if not api_key or not base_url:
            raise CometError("api_key and base_url are required")
        self._api_key = api_key
        self._base_url = base_url
        self._timeout = timeout
        self._default_headers = dict(default_headers or {})
        self._client = httpx.AsyncClient(timeout=timeout)

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "AsyncCometClient":
        return self

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        await self.close()

    def _headers(self) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "cometai-python/0.1.0",
        }
        headers.update(self._default_headers)
        return headers

    async def chat_complete(self, *, model: str, messages: list[dict[str, Any]], max_tokens: int | None = None, temperature: float | None = None, extra: dict[str, Any] | None = None) -> ChatCompletion:
        body: dict[str, Any] = {"model": model, "messages": messages, "stream": False}
        if max_tokens is not None:
            body["max_tokens"] = int(max_tokens)
        if temperature is not None:
            body["temperature"] = float(temperature)
        if extra:
            body.update(extra)
        response = await self._client.post(self._base_url + "/chat/completions", json=body, headers=self._headers())
        payload = response.json()
        _raise_for_error(response, payload)
        content, finish_reason = _extract_choice(payload)
        return ChatCompletion(
            id=str(payload.get("id") or ""),
            model=str(payload.get("model") or model),
            content=content,
            finish_reason=finish_reason,
            usage=dict(payload.get("usage") or {}),
            request_id=str(payload.get("request_id") or response.headers.get("X-Request-Id") or ""),
            trace_id=str(payload.get("trace_id") or response.headers.get("X-Trace-Id") or ""),
            raw=payload,
        )

    async def chat_stream(self, *, model: str, messages: list[dict[str, Any]], max_tokens: int | None = None, temperature: float | None = None) -> AsyncIterator[str]:
        body: dict[str, Any] = {"model": model, "messages": messages, "stream": True}
        if max_tokens is not None:
            body["max_tokens"] = int(max_tokens)
        if temperature is not None:
            body["temperature"] = float(temperature)
        async with self._client.stream("POST", self._base_url + "/chat/completions", json=body, headers={**self._headers(), "Accept": "text/event-stream"}) as response:
            if response.status_code >= 400:
                await response.aread()
                _raise_for_error(response)
            async for line in response.aiter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    line = line[6:]
                if line == "[DONE]":
                    break
                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError:
                    continue
                delta = ((chunk.get("choices") or [{}])[0].get("delta") or {}).get("content")
                if delta:
                    yield delta

    async def moderate(self, *, text: str | None = None, messages: list[dict[str, Any]] | None = None) -> ModerationResult:
        if not text and not messages:
            raise ValueError("either text or messages must be provided")
        body: dict[str, Any] = {}
        if text is not None:
            body["text"] = text
        if messages is not None:
            body["messages"] = messages
        response = await self._client.post(self._base_url + "/moderate", json=body, headers=self._headers())
        payload = response.json()
        _raise_for_error(response, payload)
        return ModerationResult(
            allowed=bool(payload.get("allowed", True)),
            decision=str(payload.get("decision") or ("allow" if payload.get("allowed", True) else "block")),
            categories=list(payload.get("categories") or []),
            matched_terms=list(payload.get("matched_terms") or []),
            request_id=str(payload.get("request_id") or response.headers.get("X-Request-Id") or ""),
            trace_id=str(payload.get("trace_id") or response.headers.get("X-Trace-Id") or ""),
            raw=payload,
        )


__all__ = [
    "CometClient",
    "AsyncCometClient",
    "CometError",
    "ChatCompletion",
    "ModerationResult",
]
