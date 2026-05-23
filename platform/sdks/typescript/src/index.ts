export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string | Array<Record<string, unknown>>;
  name?: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Any additional OpenAI-compatible parameters to pass through. */
  extra?: Record<string, unknown>;
  /** Per-request override of the client's default timeout in ms. */
  timeoutMs?: number;
  /** Optional AbortSignal to cancel the request. */
  signal?: AbortSignal;
}

export interface ChatCompletionResult {
  id: string;
  model: string;
  content: string;
  finishReason: string | null;
  usage: Record<string, number>;
  requestId: string | null;
  traceId: string | null;
  raw: Record<string, unknown>;
}

export interface ModerationResult {
  allowed: boolean;
  decision: "allow" | "block" | string;
  categories: string[];
  matchedTerms: string[];
  requestId: string | null;
  traceId: string | null;
  raw: Record<string, unknown>;
}

export interface ModerationInput {
  text?: string;
  messages?: ChatMessage[];
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface CometClientOptions {
  apiKey?: string;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  /** Default request timeout in ms. Defaults to 60_000. */
  timeoutMs?: number;
  /** Allow injecting a fetch implementation (e.g. for Node 16 / cross-fetch / tests). */
  fetch?: typeof fetch;
}

export class CometError extends Error {
  readonly statusCode: number | undefined;
  readonly errorCode: string | undefined;
  readonly requestId: string | null;
  readonly traceId: string | null;
  readonly payload: unknown;

  constructor(message: string, init: { statusCode?: number; errorCode?: string; requestId?: string | null; traceId?: string | null; payload?: unknown } = {}) {
    super(message);
    this.name = "CometError";
    this.statusCode = init.statusCode;
    this.errorCode = init.errorCode;
    this.requestId = init.requestId ?? null;
    this.traceId = init.traceId ?? null;
    this.payload = init.payload;
  }
}

const SDK_USER_AGENT = "cometai-typescript/0.1.0";

function pickEnv(name: string): string | undefined {
  const globalProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const value = globalProcess?.env?.[name];
  return typeof value === "string" ? value : undefined;
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensureClientConfig(opts: CometClientOptions): { apiKey: string; baseUrl: string; timeoutMs: number; defaultHeaders: Record<string, string>; fetchImpl: typeof fetch } {
  const apiKey = opts.apiKey ?? pickEnv("COMETAI_API_KEY") ?? "";
  const baseUrl = trimSlash(opts.baseUrl ?? pickEnv("COMETAI_BASE_URL") ?? "");
  if (!apiKey) throw new CometError("apiKey is required (pass apiKey or set COMETAI_API_KEY)");
  if (!baseUrl) throw new CometError("baseUrl is required (pass baseUrl or set COMETAI_BASE_URL)");
  const fetchImpl = opts.fetch ?? (typeof fetch !== "undefined" ? fetch : undefined);
  if (!fetchImpl) {
    throw new CometError("global fetch is not available; pass `fetch` in CometClientOptions (Node 16 needs cross-fetch / undici).");
  }
  return {
    apiKey,
    baseUrl,
    timeoutMs: opts.timeoutMs ?? 60_000,
    defaultHeaders: { ...(opts.defaultHeaders ?? {}) },
    fetchImpl,
  };
}

function joinAbort(timeoutMs: number, external?: AbortSignal): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new CometError(`request timed out after ${timeoutMs}ms`, { errorCode: "timeout" })), timeoutMs);
  const onAbort = () => controller.abort(external?.reason);
  if (external) {
    if (external.aborted) controller.abort(external.reason);
    else external.addEventListener("abort", onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer);
      external?.removeEventListener("abort", onAbort);
    },
  };
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text };
  }
}

function raiseForError(response: Response, payload: Record<string, unknown> | null): void {
  if (response.ok) return;
  const error = ((payload?.error as Record<string, unknown> | undefined) ?? payload ?? {}) as Record<string, unknown>;
  throw new CometError(String(error.message ?? response.statusText ?? "request failed"), {
    statusCode: response.status,
    errorCode: String(error.code ?? error.error_code ?? "http_error"),
    requestId: (payload?.request_id as string | undefined) ?? response.headers.get("X-Request-Id"),
    traceId: (payload?.trace_id as string | undefined) ?? response.headers.get("X-Trace-Id"),
    payload,
  });
}

function extractChoice(payload: Record<string, unknown>): { content: string; finishReason: string | null } {
  const choices = (payload.choices as Array<Record<string, unknown>> | undefined) ?? [];
  if (choices.length === 0) return { content: "", finishReason: null };
  const first = choices[0] ?? {};
  const message = (first.message as Record<string, unknown> | undefined) ?? {};
  return {
    content: typeof message.content === "string" ? (message.content as string) : "",
    finishReason: (first.finish_reason as string | undefined) ?? null,
  };
}

class ChatNamespace {
  constructor(private readonly client: CometClient) {}

  async complete(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const body = this.client._chatBody(options, false);
    const response = await this.client._postJson("/chat/completions", body, options.timeoutMs, options.signal);
    const payload = (await readJson(response)) ?? {};
    raiseForError(response, payload);
    const { content, finishReason } = extractChoice(payload);
    return {
      id: String(payload.id ?? ""),
      model: String(payload.model ?? options.model),
      content,
      finishReason,
      usage: (payload.usage as Record<string, number>) ?? {},
      requestId: (payload.request_id as string | undefined) ?? response.headers.get("X-Request-Id"),
      traceId: (payload.trace_id as string | undefined) ?? response.headers.get("X-Trace-Id"),
      raw: payload,
    };
  }

  async *stream(options: ChatCompletionOptions): AsyncIterable<string> {
    const body = this.client._chatBody(options, true);
    const response = await this.client._postStream("/chat/completions", body, options.timeoutMs, options.signal);
    if (!response.ok || !response.body) {
      const payload = await readJson(response);
      raiseForError(response, payload);
      return;
    }
    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIdx = buffer.indexOf("\n");
      while (newlineIdx !== -1) {
        let line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        if (line.startsWith("data: ")) line = line.slice(6);
        if (line === "[DONE]") return;
        if (line) {
          try {
            const chunk = JSON.parse(line) as { choices?: Array<{ delta?: { content?: string } }> };
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            /* ignore malformed line */
          }
        }
        newlineIdx = buffer.indexOf("\n");
      }
    }
  }
}

class ModerationNamespace {
  constructor(private readonly client: CometClient) {}

  async check(input: ModerationInput): Promise<ModerationResult> {
    if (!input.text && (!input.messages || input.messages.length === 0)) {
      throw new CometError("either text or messages must be provided", { errorCode: "missing_input" });
    }
    const body: Record<string, unknown> = {};
    if (input.text !== undefined) body.text = input.text;
    if (input.messages !== undefined) body.messages = input.messages;
    const response = await this.client._postJson("/moderate", body, input.timeoutMs, input.signal);
    const payload = (await readJson(response)) ?? {};
    raiseForError(response, payload);
    return {
      allowed: Boolean(payload.allowed ?? true),
      decision: String(payload.decision ?? (payload.allowed === false ? "block" : "allow")),
      categories: Array.isArray(payload.categories) ? (payload.categories as string[]) : [],
      matchedTerms: Array.isArray(payload.matched_terms) ? (payload.matched_terms as string[]) : [],
      requestId: (payload.request_id as string | undefined) ?? response.headers.get("X-Request-Id"),
      traceId: (payload.trace_id as string | undefined) ?? response.headers.get("X-Trace-Id"),
      raw: payload,
    };
  }
}

export class CometClient {
  readonly chat: ChatNamespace;
  readonly moderation: ModerationNamespace;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: CometClientOptions = {}) {
    const config = ensureClientConfig(options);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.timeoutMs = config.timeoutMs;
    this.defaultHeaders = config.defaultHeaders;
    this.fetchImpl = config.fetchImpl;
    this.chat = new ChatNamespace(this);
    this.moderation = new ModerationNamespace(this);
  }

  /** @internal */
  _chatBody(options: ChatCompletionOptions, stream: boolean): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: options.model,
      messages: options.messages,
      stream,
    };
    if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
    if (options.temperature !== undefined) body.temperature = options.temperature;
    if (options.extra) Object.assign(body, options.extra);
    return body;
  }

  /** @internal */
  _headers(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": SDK_USER_AGENT,
      ...this.defaultHeaders,
      ...(extra ?? {}),
    };
  }

  /** @internal */
  async _postJson(path: string, body: Record<string, unknown>, timeoutMs?: number, externalSignal?: AbortSignal): Promise<Response> {
    const { signal, clear } = joinAbort(timeoutMs ?? this.timeoutMs, externalSignal);
    try {
      return await this.fetchImpl(this.baseUrl + path, {
        method: "POST",
        headers: this._headers(),
        body: JSON.stringify(body),
        signal,
      });
    } finally {
      clear();
    }
  }

  /** @internal */
  async _postStream(path: string, body: Record<string, unknown>, timeoutMs?: number, externalSignal?: AbortSignal): Promise<Response> {
    const { signal } = joinAbort(timeoutMs ?? this.timeoutMs, externalSignal);
    return this.fetchImpl(this.baseUrl + path, {
      method: "POST",
      headers: this._headers({ Accept: "text/event-stream" }),
      body: JSON.stringify(body),
      signal,
    });
  }
}

export default CometClient;
