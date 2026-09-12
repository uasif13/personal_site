import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteApplication, updateApplication } from '@/lib/db/jobs';
import { JOB_STATUS_VALUES } from '@/lib/jobs/types';

const patchSchema = z.object({
  positionName: z.string().min(1).optional(),
  company: z.string().optional(),
  positionLink: z.string().url().or(z.literal('')).optional().nullable(),
  status: z.enum(JOB_STATUS_VALUES).optional(),
  dateApplied: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(''))
    .optional()
    .nullable(),
  description: z.string().optional(),
  yearsExperience: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  resumeFileId: z.number().int().optional().nullable(),
  coverLetterFileId: z.number().int().optional().nullable(),
});

const NULLABLE = ['positionLink', 'dateApplied', 'yearsExperience', 'notes'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const patch: Record<string, unknown> = { ...parsed.data };
  for (const key of NULLABLE) {
    if (patch[key] === '') patch[key] = null;
  }

  const application = await updateApplication(id, patch);
  if (!application) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ application });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  await deleteApplication(id);
  return NextResponse.json({ ok: true });
}
