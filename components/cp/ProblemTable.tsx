'use client';

import { Fragment, useMemo, useState } from 'react';
import type { ProblemWithAttempts } from '@/lib/db/queries';
import LogAttemptForm from './LogAttemptForm';

interface ProblemTableProps {
  problems: ProblemWithAttempts[];
  isAuthed: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  solved_no_help: 'No help',
  solved_with_hints: 'Used hints',
  solved_with_solution: 'Read solution',
  attempted_unsolved: 'Unsolved',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#4d8a68',
  medium: 'var(--accent)',
  hard: '#a8492f',
};

function latestAttempt(problem: ProblemWithAttempts) {
  return problem.attempts[0] ?? null;
}

export default function ProblemTable({ problems, isAuthed }: ProblemTableProps) {
  const [difficulty, setDifficulty] = useState('all');
  const [source, setSource] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      if (difficulty !== 'all' && p.difficulty.toLowerCase() !== difficulty) return false;
      if (source !== 'all' && p.source !== source) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !p.topics.some((t) => t.toLowerCase().includes(search.toLowerCase()))) {
        return false;
      }
      if (status !== 'all') {
        const latest = latestAttempt(p);
        if (status === 'unsolved' && latest) return false;
        if (status !== 'unsolved' && (!latest || latest.status !== status)) return false;
      }
      return true;
    });
  }, [problems, difficulty, source, status, search]);

  if (problems.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 text-[0.9rem] text-[var(--text-muted)]">
        Nothing logged yet. Attempt a problem, then log it.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search name or topic…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[0.8rem] text-[var(--text)] flex-1 min-w-[180px]"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[0.8rem] text-[var(--text)]"
        >
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[0.8rem] text-[var(--text)]"
        >
          <option value="all">All sources</option>
          <option value="neetcode250">NeetCode 250</option>
          <option value="codeforces">Codeforces</option>
          <option value="youkn0wwho">youkn0wwho</option>
          <option value="custom">Custom</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[0.8rem] text-[var(--text)]"
        >
          <option value="all">All statuses</option>
          <option value="unsolved">Unsolved</option>
          <option value="solved_no_help">Solved — no help</option>
          <option value="solved_with_hints">Solved — used hints</option>
          <option value="solved_with_solution">Solved — read solution</option>
        </select>
      </div>

      <div className="text-[0.75rem] text-[var(--text-muted)] mb-3 font-[var(--font-mono)]">
        {filtered.length} problem{filtered.length === 1 ? '' : 's'}
      </div>

      <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
        <table className="w-full border-collapse text-[0.85rem] min-w-[720px]">
          <thead>
            <tr className="bg-[var(--bg-card)] border-b border-[var(--border)]">
              <th className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase px-4 py-3">
                Problem
              </th>
              <th className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase px-4 py-3">
                Difficulty
              </th>
              <th className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase px-4 py-3">
                Topics
              </th>
              <th className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase px-4 py-3">
                Status
              </th>
              <th className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase px-4 py-3">
                Time
              </th>
              <th className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase px-4 py-3">
                Solution
              </th>
              <th className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase px-4 py-3">
                {' '}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((problem) => {
              const latest = latestAttempt(problem);
              const isExpanded = expandedId === problem.id;
              const hasNotes = problem.attempts.some((a) => a.notes);
              const canExpand = hasNotes || isAuthed;

              return (
                <Fragment key={problem.id}>
                  <tr
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <a
                        href={problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--text)] no-underline hover:text-[var(--accent)]"
                      >
                        {problem.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <span
                        className="font-[var(--font-mono)] text-[0.7rem] uppercase tracking-[0.06em]"
                        style={{ color: DIFFICULTY_COLOR[problem.difficulty.toLowerCase()] ?? 'var(--text-muted)' }}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2 max-w-[220px]">
                        {problem.topics.map((topic) => (
                          <span
                            key={topic}
                            className="font-[var(--font-mono)] text-[0.6rem] text-[var(--accent-dim)] tracking-[0.06em] uppercase"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap font-[var(--font-mono)] text-[0.75rem] text-[var(--text-muted)]">
                      {latest ? STATUS_LABELS[latest.status] : '—'}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap font-[var(--font-mono)] text-[0.75rem] text-[var(--text-muted)]">
                      {latest?.durationMinutes ? `${latest.durationMinutes}m` : '—'}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      {latest?.solutionUrl ? (
                        <a
                          href={latest.solutionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] text-[0.75rem] no-underline border-b border-[var(--accent-dim)] hover:border-[var(--accent)]"
                        >
                          View ↗
                        </a>
                      ) : (
                        <span className="text-[var(--text-muted)] text-[0.75rem]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      {canExpand && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : problem.id)}
                          className="font-[var(--font-mono)] text-[0.7rem] text-[var(--accent)] uppercase tracking-[0.06em]"
                        >
                          {isExpanded ? 'Close' : hasNotes ? 'View notes' : 'Log another attempt'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-[var(--border)] last:border-b-0">
                      <td colSpan={7} className="px-4 pb-4">
                        {problem.attempts.length > 0 && (
                          <div className="flex flex-col gap-3 mb-4">
                            {problem.attempts.map((attempt) => (
                              <div
                                key={attempt.id}
                                className="bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-lg p-3"
                              >
                                <div className="font-[var(--font-mono)] text-[0.7rem] text-[var(--text-muted)] mb-1">
                                  {new Date(attempt.solvedAt).toLocaleDateString()} ·{' '}
                                  {STATUS_LABELS[attempt.status]}
                                  {attempt.durationMinutes ? ` · ${attempt.durationMinutes}m` : ''}
                                </div>
                                {attempt.notes ? (
                                  <p className="text-[0.85rem] text-[var(--text)] whitespace-pre-wrap leading-[1.6]">
                                    {attempt.notes}
                                  </p>
                                ) : (
                                  <p className="text-[0.8rem] text-[var(--text-muted)] italic">
                                    No notes for this attempt.
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {isAuthed && (
                          <LogAttemptForm
                            problemId={problem.id}
                            onDone={() => setExpandedId(null)}
                          />
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
