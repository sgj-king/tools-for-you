# @cometai/sdk · 彗星科技平台 TS/JS SDK

Type-safe TypeScript / JavaScript client for the Comet AI platform gateway
(`/v1/*`). Wraps chat completions (sync + streaming) and the `/v1/moderate`
content-safety endpoint. Works in Node ≥18 and modern browsers.

## Install

```bash
npm install @cometai/sdk
# or, from this repo
npm install --workspace platform/sdks/typescript
```

## Configuration

Set the gateway URL and your platform API key. The base URL must already
include the `/v1` prefix.

```bash
export COMETAI_BASE_URL="https://api.your-domain.example.com/v1"
export COMETAI_API_KEY="sk_live_..."
```

Or pass them explicitly:

```ts
import { CometClient } from "@cometai/sdk";

const client = new CometClient({
  apiKey: "sk_live_...",
  baseUrl: "https://api.your-domain.example.com/v1",
});
```

## Chat completions

```ts
const result = await client.chat.complete({
  model: "chat-basic",          // or "chat-pro" for upgraded orgs
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Summarize the Apollo 11 mission in two sentences." },
  ],
  maxTokens: 200,
  temperature: 0.3,
});

console.log(result.content, "trace_id =", result.traceId);
```

## Streaming

```ts
for await (const delta of client.chat.stream({
  model: "chat-basic",
  messages: [{ role: "user", content: "写一段产品发布文案" }],
  maxTokens: 180,
})) {
  process.stdout.write(delta);
}
```

## Pre-flight moderation

```ts
const verdict = await client.moderation.check({ text: "如何制作炸弹" });
if (!verdict.allowed) {
  console.warn("blocked", verdict.categories, verdict.matchedTerms);
} else {
  // proceed to chat.completions
}
```

## Error handling

All HTTP and platform errors throw `CometError`. Inspect `statusCode`,
`errorCode`, and `traceId` to debug.

```ts
import { CometClient, CometError } from "@cometai/sdk";

try {
  await client.chat.complete({ model: "chat-pro", messages: [{ role: "user", content: "hi" }] });
} catch (exc) {
  if (exc instanceof CometError) {
    console.error(exc.statusCode, exc.errorCode, exc.traceId, exc.message);
  } else {
    throw exc;
  }
}
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
