import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createAttempt,
  createProblem,
  draftBlogPostFromNotes,
  getProblemByUrl,
  updateReviewAfterAttempt,
} from '@/lib/db/queries';

const logProblemSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  source: z.enum(['neetcode250', 'codeforces', 'youkn0wwho', 'custom']),
  platform: z.enum(['leetcode', 'codeforces', 'atcoder', 'other']),
  difficulty: z.string().min(1),
  topics: z.array(z.string()).default([]),
  pattern: z.string().optional().nullable(),
  cfRating: z.number().int().optional().nullable(),
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

// Creates the problem (or reuses one already logged at the same URL) and its
// first attempt in one call — problems only ever enter the tracker alongside
// an attempt, never pre-populated ahead of actually trying them.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = logProblemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { draftBlogPost, status, durationMinutes, solutionUrl, notes, ...problemInput } =
    parsed.data;

  const problem =
    (await getProblemByUrl(problemInput.url)) ?? (await createProblem(problemInput));

  const blogPostId = draftBlogPost && notes ? await draftBlogPostFromNotes(problem, notes) : null;

  const attempt = await createAttempt({
    problemId: problem.id,
    status,
    durationMinutes,
    solutionUrl,
    notes,
    blogPostId,
  });
  await updateReviewAfterAttempt(problem.id, status, durationMinutes);

  return NextResponse.json({ problem, attempt }, { status: 201 });
}
