import { cookies } from 'next/headers';
import Link from 'next/link';
import Nav from '@/components/Nav';
import ProblemTable from '@/components/cp/ProblemTable';
import StatsBar, { SOLVED_STATUSES } from '@/components/cp/StatsBar';
import ActivityCalendar from '@/components/cp/ActivityCalendar';
import Recommendations from '@/components/cp/Recommendations';
import { CP_SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import {
  getAllProblemsWithAttempts,
  getDueReviews,
  type DueReview,
  type ProblemWithAttempts,
} from '@/lib/db/queries';
import {
  recommendNewProblems,
  recommendCodeforcesProblems,
  rankDueReviews,
} from '@/lib/cp/recommend';
import type { Neetcode250Problem } from '@/lib/cp/neetcode250';
import type { CodeforcesProblem } from '@/lib/cp/codeforces';

export const metadata = {
  title: 'CP Tracker — Asif Uddin',
  description: 'Tracking the road to LeetCode Guardian and Codeforces Red, one problem at a time.',
};

export const dynamic = 'force-dynamic';

export default async function CpTrackerPage() {
  const cookieStore = await cookies();
  const isAuthed = await verifySessionToken(cookieStore.get(CP_SESSION_COOKIE)?.value);

  let problems: ProblemWithAttempts[] = [];
  let dueReviews: DueReview[] = [];
  let dueTotal = 0;
  let newSuggestions: Neetcode250Problem[] = [];
  let cfSuggestions: CodeforcesProblem[] = [];
  let dbError = false;

  try {
    [problems, dueReviews] = await Promise.all([getAllProblemsWithAttempts(), getDueReviews()]);
    dueTotal = dueReviews.length;
    dueReviews = rankDueReviews(dueReviews);
    newSuggestions = recommendNewProblems(problems);
    cfSuggestions = recommendCodeforcesProblems(problems);
  } catch {
    dbError = true;
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-24 px-6 sm:px-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-4">
            <div>
              <div className="font-[var(--font-mono)] text-[0.7rem] text-[var(--accent)] tracking-[0.25em] uppercase mb-3">
                CP Tracker
              </div>
              <h1 className="font-[var(--font-serif)] text-[clamp(2rem,4vw,3.5rem)] tracking-tight font-normal">
                Road to Guardian &amp; Red
              </h1>
            </div>
            {isAuthed && !dbError && (
              <Link
                href="/cp/admin/log"
                className="bg-[var(--accent)] text-[var(--bg)] px-5 py-2.5 rounded font-semibold text-[0.8rem] tracking-[0.06em] transition-all hover:opacity-85 whitespace-nowrap"
              >
                + Log a problem
              </Link>
            )}
          </div>
          <p className="text-[0.9rem] text-[var(--text-muted)] leading-[1.7] mb-12 max-w-[640px]">
            A log of every problem attempted, how it was solved, and how long it
            took — nothing is added until it&apos;s actually been attempted. Recommendations
            draw from{' '}
            <a
              href="https://neetcode.io/practice"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] border-b border-[var(--accent-dim)] hover:border-[var(--accent)]"
            >
              NeetCode 250
            </a>{' '}
            and the full{' '}
            <a
              href="https://codeforces.com/problemset"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] border-b border-[var(--accent-dim)] hover:border-[var(--accent)]"
            >
              Codeforces problemset
            </a>
            , with the topic taxonomy on{' '}
            <a
              href="https://youkn0wwho.academy/topic-list"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] border-b border-[var(--accent-dim)] hover:border-[var(--accent)]"
            >
              youkn0wwho&apos;s Topic List
            </a>{' '}
            as a reference for deeper CP topics.
          </p>

          {dbError ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 text-[0.9rem] text-[var(--text-muted)]">
              The tracker database isn&apos;t configured yet. Set{' '}
              <code className="font-[var(--font-mono)] text-[var(--accent)]">DATABASE_URL</code>,{' '}
              <code className="font-[var(--font-mono)] text-[var(--accent)]">CP_ADMIN_PASSWORD</code>, and{' '}
              <code className="font-[var(--font-mono)] text-[var(--accent)]">SESSION_SECRET</code>{' '}
              and run <code className="font-[var(--font-mono)] text-[var(--accent)]">npm run db:push</code>.
            </div>
          ) : (
            <>
              <StatsBar problems={problems} />
              <div className="mt-4">
                <ActivityCalendar
                  activity={problems.flatMap((p) =>
                    p.attempts.map((a) => ({
                      at: new Date(a.solvedAt).toISOString(),
                      solved: SOLVED_STATUSES.has(a.status),
                    }))
                  )}
                />
              </div>
              <div className="mt-12">
                <Recommendations
                  dueReviews={dueReviews}
                  dueTotal={dueTotal}
                  newSuggestions={newSuggestions}
                  cfSuggestions={cfSuggestions}
                  isAuthed={isAuthed}
                />
                <ProblemTable problems={problems} isAuthed={isAuthed} />
              </div>
              {!isAuthed && (
                <p className="mt-8 text-[0.8rem] text-[var(--text-muted)]">
                  <a
                    href="/cp/login"
                    className="text-[var(--accent)] border-b border-[var(--accent-dim)] hover:border-[var(--accent)]"
                  >
                    Log in
                  </a>{' '}
                  to log problems or attempts.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
