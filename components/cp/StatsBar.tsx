import type { ProblemWithAttempts } from '@/lib/db/queries';

interface StatsBarProps {
  problems: ProblemWithAttempts[];
}

export const SOLVED_STATUSES = new Set([
  'solved_no_help',
  'solved_multiple_attempts',
  'solved_with_hints',
  'solved_with_solution',
]);

function isSolved(problem: ProblemWithAttempts): boolean {
  return problem.attempts.some((a) => SOLVED_STATUSES.has(a.status));
}

export default function StatsBar({ problems }: StatsBarProps) {
  const solved = problems.filter(isSolved);
  const byDifficulty = (difficulty: string) =>
    solved.filter((p) => p.difficulty.toLowerCase() === difficulty).length;

  const totalMinutes = problems
    .flatMap((p) => p.attempts)
    .reduce((sum, a) => sum + (a.durationMinutes ?? 0), 0);

  const solvedDates = new Set(
    problems
      .flatMap((p) => p.attempts)
      .filter((a) => SOLVED_STATUSES.has(a.status))
      .map((a) => new Date(a.solvedAt).toDateString())
  );

  const stats = [
    { label: 'Solved', value: `${solved.length} / ${problems.length}` },
    { label: 'Easy', value: byDifficulty('easy') },
    { label: 'Medium', value: byDifficulty('medium') },
    { label: 'Hard', value: byDifficulty('hard') },
    { label: 'Active Days', value: solvedDates.size },
    { label: 'Hours Logged', value: Math.round((totalMinutes / 60) * 10) / 10 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center"
        >
          <div className="font-[var(--font-serif)] text-[1.8rem] text-[var(--accent)]">
            {stat.value}
          </div>
          <div className="font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.1em] uppercase mt-1">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
