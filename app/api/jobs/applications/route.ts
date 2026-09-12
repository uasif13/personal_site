import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApplication, getAllApplications } from '@/lib/db/jobs';
import { JOB_STATUS_VALUES } from '@/lib/jobs/types';

const applicationSchema = z.object({
  positionName: z.string().min(1),
  company: z.string().default(''),
  positionLink: z.string().url().or(z.literal('')).optional().nullable(),
  status: z.enum(JOB_STATUS_VALUES).default('to_apply'),
  dateApplied: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(''))
    .optional()
    .nullable(),
  description: z.string().default(''),
  yearsExperience: z.string().optional().nullable(),
  skills: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  resumeFileId: z.number().int().optional().nullable(),
  coverLetterFileId: z.number().int().optional().nullable(),
});

/** Empty strings from the form mean "not set", not a literal empty value. */
function blankToNull<T extends Record<string, unknown>>(input: T): T {
  const out = { ...input };
  for (const key of ['positionLink', 'dateApplied', 'yearsExperience', 'notes'] as const) {
    if (out[key] === '') (out as Record<string, unknown>)[key] = null;
  }
  return out;
}

export async function GET() {
  return NextResponse.json({ applications: await getAllApplications() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = applicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const application = await createApplication(blankToNull(parsed.data));
  return NextResponse.json({ application }, { status: 201 });
}
