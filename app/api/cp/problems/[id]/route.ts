import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProblemById, updateProblem } from '@/lib/db/queries';

// Auth comes from middleware.ts, which gates every mutating method under
// /api/cp/problems — same as the attempts routes.
const updateProblemSchema = z.object({
  platform: z.enum(['leetcode', 'codeforces', 'atcoder', 'other']),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problemId = Number(id);
  if (!Number.isInteger(problemId)) {
    return NextResponse.json({ error: 'Invalid problem id' }, { status: 400 });
  }

  const existing = await getProblemById(problemId);
  if (!existing) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProblemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const problem = await updateProblem(problemId, parsed.data);
  return NextResponse.json({ problem });
}
