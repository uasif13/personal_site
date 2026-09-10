import { desc, eq, inArray } from 'drizzle-orm';
import { db } from './index';
import { attempts, blogPosts, problems } from './schema';
import { slugify } from '../slugify';

export type Problem = typeof problems.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type DbBlogPost = typeof blogPosts.$inferSelect;

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
