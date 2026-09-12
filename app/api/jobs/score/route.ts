import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApplicationById, getJobFile, updateApplication } from '@/lib/db/jobs';
import {
  AnthropicApiError,
  AnthropicTimeoutError,
  MissingApiKeyError,
  TruncatedResponseError,
} from '@/lib/jobs/anthropic';
import { scoreResumeAgainstJob } from '@/lib/jobs/score';
import type { JobAnalysis } from '@/lib/jobs/types';

const schema = z.object({ applicationId: z.number().int() });

// Generous: observed latency for these calls ranges from ~14s to ~97s.
// The platform clamps this to the plan's function duration limit.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const application = await getApplicationById(parsed.data.applicationId);
  if (!application) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!application.resumeFileId) {
    return NextResponse.json(
      { error: 'Attach the resume you plan to send before scoring it.' },
      { status: 400 }
    );
  }
  if (application.description.trim().length < 40) {
    return NextResponse.json(
      { error: 'Paste the job description first — there is nothing to score against.' },
      { status: 400 }
    );
  }

  const resume = await getJobFile(application.resumeFileId);
  if (!resume) {
    return NextResponse.json({ error: 'Attached resume is missing.' }, { status: 404 });
  }

  try {
    const resumeScore = await scoreResumeAgainstJob(
      { data: resume.data, contentType: resume.contentType, filename: resume.filename },
      application.description,
      application.positionName,
      application.company,
      (application.analysis as JobAnalysis | null) ?? null
    );

    await updateApplication(application.id, { resumeScore });
    return NextResponse.json({ resumeScore });
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('Resume scoring failed:', error);
    // Surface causes the user can actually act on — exhausted credits, a revoked
    // key, a rate limit — rather than making them dig through the server log.
    if (error instanceof AnthropicTimeoutError) {
      return NextResponse.json(
        { error: `Scoring timed out — the model took too long. Try again; if it keeps happening your hosting plan's function limit is likely the cap.` },
        { status: 504 }
      );
    }
    if (error instanceof TruncatedResponseError) {
      return NextResponse.json(
        { error: `Scoring was cut off before it finished. Try again.` },
        { status: 502 }
      );
    }
    if (error instanceof AnthropicApiError && error.isActionable) {
      return NextResponse.json({ error: `Scoring failed — ${error.apiMessage}` }, { status: 502 });
    }
    return NextResponse.json(
      { error: 'Scoring failed. Check the server logs and try again.' },
      { status: 502 }
    );
  }
}
