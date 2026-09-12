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
  validate: (raw: unknown) => T;
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
  validate,
}: ToolCallOptions<T>): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
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

  const payload = (await response.json()) as {
    content?: Array<{ type: string; name?: string; input?: unknown }>;
  };
  const toolUse = payload.content?.find(
    (block) => block.type === 'tool_use' && block.name === toolName
  );

  if (!toolUse?.input) {
    throw new Error('Anthropic API returned no structured result.');
  }

  return validate(toolUse.input);
}
