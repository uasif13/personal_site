import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAttemptById, updateAttempt } from '@/lib/db/queries';

const updateAttemptSchema = z.object({
  status: z.enum([
    'solved_no_help',
    'solved_multiple_attempts',
    'solved_with_hints',
    'solved_with_solution',
    'attempted_unsolved',
  ]),
  durationMinutes: z.number().int().positive().optional().nullable(),
  solutionUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attemptId = Number(id);
  if (!Number.isInteger(attemptId)) {
    return NextResponse.json({ error: 'Invalid attempt id' }, { status: 400 });
  }

  const existing = await getAttemptById(attemptId);
  if (!existing) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const attempt = await updateAttempt(attemptId, parsed.data);
  return NextResponse.json({ attempt });
}
