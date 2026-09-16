import { NEETCODE_250, NEETCODE_250_CATEGORIES, categorySlug, type Neetcode250Problem } from './neetcode250';
import { CODEFORCES_PROBLEMS, codeforcesUrl, type CodeforcesProblem } from './codeforces';
import type { ProblemWithAttempts } from '../db/queries';

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

function difficultyRank(difficulty: string): number {
  return DIFFICULTY_ORDER[difficulty.toLowerCase()] ?? 3;
}

/** Round-robins across ranked queues (least-covered topic first) until `limit` items are picked. */
function roundRobinPick<T>(queues: T[][], limit: number): T[] {
  const picked: T[] = [];
  let exhausted = false;
  while (picked.length < limit && !exhausted) {
    exhausted = true;
    for (const queue of queues) {
      if (picked.length >= limit) break;
      const next = queue.shift();
      if (next) {
        picked.push(next);
        exhausted = false;
      }
    }
  }
  return picked;
}

export interface LoggedProblemSummary {
  url: string;
  topics: string[];
}

/**
 * Recommends unattempted NeetCode 250 problems, prioritizing categories the
 * user has covered the least (by fraction of that category's problems already
 * logged), and easier problems within a category before harder ones — so gaps
 * get filled broadly before drilling into any one topic's hardest problems.
 */
export function recommendNewProblems(
  loggedProblems: LoggedProblemSummary[],
  limit = 6
): Neetcode250Problem[] {
  const loggedUrls = new Set(loggedProblems.map((p) => p.url));
  const loggedTopicSlugs = new Set(loggedProblems.flatMap((p) => p.topics));

  const byCategory = new Map<string, Neetcode250Problem[]>();
  for (const problem of NEETCODE_250) {
    const list = byCategory.get(problem.category) ?? [];
    list.push(problem);
    byCategory.set(problem.category, list);
  }

  const categoriesByCoverage = [...NEETCODE_250_CATEGORIES].sort((a, b) => {
    const coverage = (category: string) => {
      const slug = categorySlug(category);
      const total = byCategory.get(category)?.length ?? 1;
      const covered = loggedTopicSlugs.has(slug)
        ? loggedProblems.filter((p) => p.topics.includes(slug)).length
        : 0;
      return covered / total;
    };
    return coverage(a) - coverage(b);
  });

  const queues = categoriesByCoverage.map((category) =>
    (byCategory.get(category) ?? [])
      .filter((p) => !loggedUrls.has(p.leetcode_url))
      .sort((a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty))
  );

  return roundRobinPick(queues, limit);
}

const DEFAULT_STARTING_RATING = 900;
const RATING_BAND_WIDTH = 300;

/**
 * Recommends unattempted Codeforces problems in a rating band starting at the
 * user's current edge — the hardest problem they solved unaided but only after
 * several tries, falling back to their hardest clean solve (classic "upsolve
 * slightly above your level" CP advice) — diversified across tags they've
 * touched least, the same least-covered-first round robin as the NeetCode
 * recommendations.
 */
export function recommendCodeforcesProblems(
  loggedProblems: ProblemWithAttempts[],
  limit = 6
): CodeforcesProblem[] {
  const cfLogged = loggedProblems.filter((p) => p.platform === 'codeforces');
  const loggedUrls = new Set(cfLogged.map((p) => p.url));

  // A problem that took several unaided tries sits right at the current edge,
  // so it anchors the band ahead of clean solves — those can be well below it.
  // Problems recommended from the CF problemset carry their rating in cfRating,
  // but hand-logged ones leave it null and keep the rating in difficulty ("800").
  // Reading only cfRating missed every hand-logged problem, which is all of them
  // so far — the band then always fell back to the default.
  const ratingOf = (problem: ProblemWithAttempts): number | null => {
    if (problem.cfRating != null) return problem.cfRating;
    const fromDifficulty = Number(problem.difficulty.trim());
    return Number.isInteger(fromDifficulty) && fromDifficulty > 0 ? fromDifficulty : null;
  };

  const ratingsSolvedAs = (status: string) =>
    cfLogged
      .filter((p) => p.attempts.some((a) => a.status === status))
      .map(ratingOf)
      .filter((rating): rating is number => rating != null);

  const struggledRatings = ratingsSolvedAs('solved_multiple_attempts');
  const cleanRatings = ratingsSolvedAs('solved_no_help');
  const anchorRatings = struggledRatings.length ? struggledRatings : cleanRatings;
  const estimatedRating = anchorRatings.length
    ? Math.max(...anchorRatings)
    : DEFAULT_STARTING_RATING;

  const lowerBound = estimatedRating;
  const upperBound = estimatedRating + RATING_BAND_WIDTH;

  const tagCounts = new Map<string, number>();
  for (const p of cfLogged) {
    for (const tag of p.topics) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  const candidates = CODEFORCES_PROBLEMS.filter(
    (p) =>
      p.rating >= lowerBound && p.rating <= upperBound && !loggedUrls.has(codeforcesUrl(p))
  );

  const byTag = new Map<string, CodeforcesProblem[]>();
  for (const p of candidates) {
    const tag = p.tags[0] ?? 'misc';
    const list = byTag.get(tag) ?? [];
    list.push(p);
    byTag.set(tag, list);
  }

  const tagsByCoverage = [...byTag.keys()].sort(
    (a, b) => (tagCounts.get(a) ?? 0) - (tagCounts.get(b) ?? 0)
  );

  const queues = tagsByCoverage.map((tag) =>
    (byTag.get(tag) ?? []).sort((a, b) => a.rating - b.rating)
  );

  return roundRobinPick(queues, limit);
}
