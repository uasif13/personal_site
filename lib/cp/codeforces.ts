import data from './data/codeforces.json';

export interface CodeforcesProblem {
  contestId: number;
  index: string;
  name: string;
  rating: number;
  tags: string[];
}

// Full rated Codeforces problemset, pulled from the official API
// (codeforces.com/api/problemset.problems) — used for recommendations only,
// never pre-inserted into the tracker.
export const CODEFORCES_PROBLEMS: CodeforcesProblem[] = data.problems;

export function codeforcesUrl(problem: CodeforcesProblem): string {
  return `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;
}
