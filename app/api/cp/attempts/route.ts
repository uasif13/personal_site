import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createAttempt,
  draftBlogPostFromNotes,
  getProblemById,
  updateReviewAfterAttempt,
} from '@/lib/db/queries';

const createAttemptSchema = z.object({
  problemId: z.number().int(),
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
  draftBlogPost: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createAttemptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { draftBlogPost, ...attemptInput } = parsed.data;

  const problem = await getProblemById(attemptInput.problemId);
  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const blogPostId =
    draftBlogPost && attemptInput.notes
      ? await draftBlogPostFromNotes(problem, attemptInput.notes)
      : null;

  const attempt = await createAttempt({ ...attemptInput, blogPostId });
  await updateReviewAfterAttempt(problem.id, attemptInput.status, attemptInput.durationMinutes);

  return NextResponse.json({ attempt }, { status: 201 });
}
