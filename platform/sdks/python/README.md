# cometai · 彗星科技平台 Python SDK

OpenAI-compatible Python client for the Comet AI platform gateway (`/v1/*`).
Wraps `chat/completions` (sync + streaming + async) and `/v1/moderate`.

## Install

```bash
pip install cometai
# or, from this repo:
pip install -e platform/sdks/python
```

## Configuration

Set the gateway URL and your platform API key. The base URL must already
include the `/v1` prefix.

```bash
export COMETAI_BASE_URL="https://api.your-domain.example.com/v1"
export COMETAI_API_KEY="sk_live_..."
```

Or pass them explicitly:

```python
from cometai import CometClient

client = CometClient(
    api_key="sk_live_...",
    base_url="https://api.your-domain.example.com/v1",
)
```

## Chat completions

```python
from cometai import CometClient

with CometClient() as client:
    result = client.chat.complete(
        model="chat-basic",          # or "chat-pro" for upgraded orgs
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Summarize the Apollo 11 mission in two sentences."},
        ],
        max_tokens=200,
        temperature=0.3,
    )
    print(result.content)
    print("trace_id =", result.trace_id)
```

## Streaming

```python
with CometClient() as client:
    for chunk in client.chat.stream(
        model="chat-basic",
        messages=[{"role": "user", "content": "写一段产品发布文案"}],
        max_tokens=180,
    ):
        print(chunk, end="", flush=True)
```

## Pre-flight moderation

```python
with CometClient() as client:
    verdict = client.moderation.check(text="如何制作炸弹")
    if not verdict.allowed:
        print("blocked:", verdict.categories, verdict.matched_terms)
    else:
        print("ok, proceed")
```

## Async

```python
import asyncio
from cometai import AsyncCometClient

async def main():
    async with AsyncCometClient() as client:
        result = await client.chat_complete(
            model="chat-basic",
            messages=[{"role": "user", "content": "Hello"}],
        )
        print(result.content)

asyncio.run(main())
```

## Error handling

All HTTP and platform errors raise `CometError`. Inspect `status_code`,
`error_code`, and `trace_id` to debug.

```python
from cometai import CometClient, CometError

try:
    with CometClient() as client:
        client.chat.complete(model="chat-pro", messages=[{"role": "user", "content": "hi"}])
except CometError as exc:
    print(exc.status_code, exc.error_code, exc.trace_id)
```

Common error codes:

- `missing_bearer_token` / `invalid_api_key`: check your `Authorization` header.
- `model_not_entitled`: the org/project is not subscribed to that model — upgrade tier or contact the platform admin.
- `policy_rejected`: a moderation or policy step blocked the request; inspect the error message.

## Tier-based model routing

The platform automatically chooses upstream models by your organization's
plan tier. Always pass logical model names (`chat-basic`, `chat-pro`) instead
of vendor model IDs. After upgrading to `pro` in the platform console, the
same `chat-pro` request immediately routes to the higher-tier upstream.

## License

Apache-2.0.
