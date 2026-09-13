import { desc, eq, inArray, lte } from 'drizzle-orm';
import { db } from './index';
import { attempts, blogPosts, problems, reviews } from './schema';
import { slugify } from '../slugify';
import {
  INITIAL_REVIEW_STATE,
  addDays,
  nextReviewState,
  qualityFromAttempt,
  type AttemptStatus,
} from '../spaced-repetition';

export type Problem = typeof problems.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type DbBlogPost = typeof blogPosts.$inferSelect;
export type Review = typeof reviews.$inferSelect;

export interface ProblemWithAttempts extends Problem {
  attempts: Attempt[];
}

export async function getAllProblemsWithAttempts(): Promise<ProblemWithAttempts[]> {
  const [allProblems, allAttempts] = await Promise.all([
    db.select().from(problems).orderBy(problems.name),
    db.select().from(attempts).orderBy(desc(attempts.solvedAt)),
  ]);

  const attemptsByProblem = new Map<number, Attempt[]>();
  for (const attempt of allAttempts) {
    const list = attemptsByProblem.get(attempt.problemId) ?? [];
    list.push(attempt);
    attemptsByProblem.set(attempt.problemId, list);
  }

  return allProblems.map((problem) => ({
    ...problem,
    attempts: attemptsByProblem.get(problem.id) ?? [],
  }));
}

export async function getProblemById(id: number): Promise<Problem | null> {
  const rows = await db.select().from(problems).where(eq(problems.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getProblemByUrl(url: string): Promise<Problem | null> {
  const rows = await db.select().from(problems).where(eq(problems.url, url)).limit(1);
  return rows[0] ?? null;
}

export async function createProblem(data: {
  name: string;
  url: string;
  source: string;
  platform: string;
  difficulty: string;
  topics: string[];
  pattern?: string | null;
  cfRating?: number | null;
}): Promise<Problem> {
  const [row] = await db.insert(problems).values(data).returning();
  return row;
}

export async function createAttempt(data: {
  problemId: number;
  status: string;
  durationMinutes?: number | null;
  solutionUrl?: string | null;
  notes?: string | null;
  blogPostId?: number | null;
}): Promise<Attempt> {
  const [row] = await db.insert(attempts).values(data).returning();
  return row;
}

export async function updateAttempt(
  id: number,
  data: {
    status: string;
    durationMinutes?: number | null;
    solutionUrl?: string | null;
    notes?: string | null;
  }
): Promise<Attempt | null> {
  const [row] = await db
    .update(attempts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(attempts.id, id))
    .returning();
  return row ?? null;
}

export async function getAttemptById(id: number): Promise<Attempt | null> {
  const rows = await db.select().from(attempts).where(eq(attempts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createBlogPostFromAttempt(data: {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string;
  problemId: number;
}): Promise<DbBlogPost> {
  const [row] = await db.insert(blogPosts).values(data).returning();
  return row;
}

export async function getAllDbBlogPosts(): Promise<DbBlogPost[]> {
  return db.select().from(blogPosts).orderBy(desc(blogPosts.date));
}

export async function getDbBlogPostBySlug(slug: string): Promise<DbBlogPost | null> {
  const rows = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getProblemsByIds(ids: number[]): Promise<Problem[]> {
  if (ids.length === 0) return [];
  return db.select().from(problems).where(inArray(problems.id, ids));
}

/**
 * Advances a problem's spaced-repetition schedule after a new attempt, using
 * SM-2 with a quality score inferred from how the attempt went. Creates the
 * review row on a problem's first attempt.
 */
export async function updateReviewAfterAttempt(
  problemId: number,
  status: AttemptStatus,
  durationMinutes: number | null | undefined
): Promise<void> {
  const quality = qualityFromAttempt(status, durationMinutes);
  const existing = await db
    .select()
    .from(reviews)
    .where(eq(reviews.problemId, problemId))
    .limit(1);

  const previous = existing[0]
    ? {
        easeFactor: existing[0].easeFactor,
        intervalDays: existing[0].intervalDays,
        repetitions: existing[0].repetitions,
      }
    : INITIAL_REVIEW_STATE;

  const next = nextReviewState(previous, quality);
  const now = new Date();
  const nextReviewDate = addDays(now, next.intervalDays);

  if (existing[0]) {
    await db
      .update(reviews)
      .set({ ...next, nextReviewDate, lastReviewedAt: now })
      .where(eq(reviews.problemId, problemId));
  } else {
    await db.insert(reviews).values({
      problemId,
      ...next,
      nextReviewDate,
      lastReviewedAt: now,
    });
  }
}

export interface DueReview {
  review: Review;
  problem: Problem;
  lastAttempt: Attempt | null;
}

export async function getDueReviews(): Promise<DueReview[]> {
  const dueRows = await db
    .select()
    .from(reviews)
    .where(lte(reviews.nextReviewDate, new Date()))
    .orderBy(reviews.nextReviewDate);

  if (dueRows.length === 0) return [];

  const problemIds = dueRows.map((r) => r.problemId);
  const [dueProblems, allAttempts] = await Promise.all([
    getProblemsByIds(problemIds),
    db
      .select()
      .from(attempts)
      .where(inArray(attempts.problemId, problemIds))
      .orderBy(desc(attempts.solvedAt)),
  ]);

  const problemById = new Map(dueProblems.map((p) => [p.id, p]));
  const lastAttemptByProblem = new Map<number, Attempt>();
  for (const attempt of allAttempts) {
    if (!lastAttemptByProblem.has(attempt.problemId)) {
      lastAttemptByProblem.set(attempt.problemId, attempt);
    }
  }

  return dueRows
    .map((review) => {
      const problem = problemById.get(review.problemId);
      if (!problem) return null;
      return {
        review,
        problem,
        lastAttempt: lastAttemptByProblem.get(review.problemId) ?? null,
      };
    })
    .filter((r): r is DueReview => r !== null);
}

/** Drafts a blog post from a solve's strategy notes, deduping the slug. Returns its id. */
export async function draftBlogPostFromNotes(
  problem: Problem,
  notes: string
): Promise<number> {
  const title = `${problem.name} — Strategy`;
  const baseSlug = slugify(title);
  const existingSlugs = new Set((await getAllDbBlogPosts()).map((p) => p.slug));
  let slug = baseSlug;
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const post = await createBlogPostFromAttempt({
    slug,
    title,
    date: new Date().toISOString().slice(0, 10),
    tags: [...problem.topics, problem.platform],
    excerpt: notes.slice(0, 180),
    content: notes,
    problemId: problem.id,
  });
  return post.id;
}
