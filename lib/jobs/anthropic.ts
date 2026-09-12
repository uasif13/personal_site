// Minimal Anthropic Messages API client over fetch — the job tracker only needs
// single-turn structured extraction, which isn't worth an SDK dependency.

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

/** Cheap and fast — used for pulling structured fields out of a job description. */
export const EXTRACTION_MODEL = 'claude-haiku-4-5';
/** Stronger judgment — used for critiquing a resume against a posting. */
export const CRITIQUE_MODEL = 'claude-sonnet-5';

/**
 * An error the API itself reported. `status` and `apiMessage` are kept separate
 * so routes can surface actionable causes — exhausted credits, a bad key, a rate
 * limit — to the user instead of burying them in the server log.
 */
export class AnthropicApiError extends Error {
  constructor(
    readonly status: number,
    readonly apiMessage: string
  ) {
    super(`Anthropic API error ${status}: ${apiMessage}`);
    this.name = 'AnthropicApiError';
  }

  /** 4xx means someone must change something (billing, key, quota); 5xx is transient. */
  get isActionable(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      'ANTHROPIC_API_KEY is not set — add it to .env.local (and to your Vercel project settings) to use the analysis features.'
    );
    this.name = 'MissingApiKeyError';
  }
}

export type ContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'document';
      source: { type: 'base64'; media_type: string; data: string };
    };

interface ToolCallOptions<T> {
  model: string;
  system: string;
  content: ContentBlock[];
  /** JSON Schema the response must conform to. */
  schema: Record<string, unknown>;
  toolName: string;
  toolDescription: string;
  maxTokens?: number;
  /** Aborts the request if the API hasn't finished within this many ms. */
  timeoutMs?: number;
  validate: (raw: unknown) => T;
}

export class AnthropicTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Anthropic API did not respond within ${Math.round(timeoutMs / 1000)}s.`);
    this.name = 'AnthropicTimeoutError';
  }
}

export class TruncatedResponseError extends Error {
  constructor() {
    super('The model hit its output limit before finishing the result.');
    this.name = 'TruncatedResponseError';
  }
}

/**
 * Reads the SSE stream and rebuilds the forced tool call's JSON input from its
 * `input_json_delta` fragments.
 *
 * Streaming matters here for two reasons: these requests can run over a minute,
 * and an idle connection is what proxies and gateways kill first — a stream keeps
 * bytes flowing. It also surfaces `stop_reason`, so a response cut off at
 * max_tokens raises instead of silently parsing into a half-empty result.
 */
async function readToolInputFromStream(
  body: ReadableStream<Uint8Array>,
  toolName: string
): Promise<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let toolIndex: number | null = null;
  let json = '';
  let stopReason: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line; keep any partial tail buffered.
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const dataLine = frame.split('\n').find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      let event: Record<string, unknown>;
      try {
        event = JSON.parse(dataLine.slice(5).trim());
      } catch {
        continue;
      }

      if (event.type === 'error') {
        const message = (event.error as { message?: string })?.message ?? 'stream error';
        throw new Error(`Anthropic stream error: ${message}`);
      }

      if (event.type === 'content_block_start') {
        const block = event.content_block as { type?: string; name?: string };
        if (block?.type === 'tool_use' && block.name === toolName) {
          toolIndex = event.index as number;
        }
      } else if (event.type === 'content_block_delta' && event.index === toolIndex) {
        const delta = event.delta as { type?: string; partial_json?: string };
        if (delta?.type === 'input_json_delta') json += delta.partial_json ?? '';
      } else if (event.type === 'message_delta') {
        stopReason = (event.delta as { stop_reason?: string })?.stop_reason ?? stopReason;
      }
    }
  }

  if (stopReason === 'max_tokens') throw new TruncatedResponseError();
  if (!json) throw new Error('Anthropic API returned no structured result.');

  return JSON.parse(json);
}

/**
 * Runs a single-turn request that is forced to answer by calling one tool, so the
 * result arrives as a validated object rather than prose we'd have to parse.
 */
export async function extractStructured<T>({
  model,
  system,
  content,
  schema,
  toolName,
  toolDescription,
  maxTokens = 4096,
  timeoutMs = 240_000,
  validate,
}: ToolCallOptions<T>): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();

  try {
    return await runStructuredRequest({
      apiKey,
      model,
      system,
      content,
      schema,
      toolName,
      toolDescription,
      maxTokens,
      timeoutMs,
      validate,
    });
  } catch (error) {
    // AbortSignal.timeout rejects with a DOMException named TimeoutError — during
    // the initial fetch or mid-stream — which the routes can't recognize as-is.
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new AnthropicTimeoutError(timeoutMs);
    }
    throw error;
  }
}

async function runStructuredRequest<T>({
  apiKey,
  model,
  system,
  content,
  schema,
  toolName,
  toolDescription,
  maxTokens,
  timeoutMs,
  validate,
}: Required<Omit<ToolCallOptions<T>, 'maxTokens' | 'timeoutMs'>> & {
  apiKey: string;
  maxTokens: number;
  timeoutMs: number;
}): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      system,
      // strict makes the API guarantee tool input validates against the schema,
      // rather than us discovering a wrong-typed field at parse time.
      tools: [
        { name: toolName, description: toolDescription, input_schema: schema, strict: true },
      ],
      tool_choice: { type: 'tool', name: toolName },
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    let apiMessage = detail.slice(0, 300);
    try {
      apiMessage = JSON.parse(detail)?.error?.message ?? apiMessage;
    } catch {
      // Non-JSON error body — fall back to the raw text.
    }
    throw new AnthropicApiError(response.status, apiMessage);
  }

  if (!response.body) {
    throw new Error('Anthropic API returned an empty response body.');
  }

  return validate(await readToolInputFromStream(response.body, toolName));
}
