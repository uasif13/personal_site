import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApplicationById, updateApplication } from '@/lib/db/jobs';
import { analyzeJobDescription } from '@/lib/jobs/analyze';
import { AnthropicApiError, MissingApiKeyError } from '@/lib/jobs/anthropic';

const schema = z.object({
  description: z.string().min(40, 'Paste the job description first — this one is too short to analyze.'),
  positionName: z.string().default(''),
  company: z.string().default(''),
  /** When present the result is cached onto that application row. */
  applicationId: z.number().int().optional().nullable(),
});

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const { description, positionName, company, applicationId } = parsed.data;

  try {
    const analysis = await analyzeJobDescription(description, positionName, company);

    if (applicationId) {
      await updateApplication(applicationId, { analysis });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('Job analysis failed:', error);
    // Surface causes the user can actually act on — exhausted credits, a revoked
    // key, a rate limit — rather than making them dig through the server log.
    if (error instanceof AnthropicApiError && error.isActionable) {
      return NextResponse.json({ error: `Analysis failed — ${error.apiMessage}` }, { status: 502 });
    }
    return NextResponse.json(
      { error: 'Analysis failed. Check the server logs and try again.' },
      { status: 502 }
    );
  }
}

/** Convenience for re-reading a cached analysis without re-billing the API. */
export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get('applicationId'));
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid applicationId' }, { status: 400 });
  }
  const application = await getApplicationById(id);
  if (!application) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ analysis: application.analysis ?? null });
}
