'use client';

import { Fragment, useMemo, useState } from 'react';
import type { ProblemWithAttempts } from '@/lib/db/queries';
import LogAttemptForm from './LogAttemptForm';
import EditAttemptForm from './EditAttemptForm';

interface ProblemTableProps {
  problems: ProblemWithAttempts[];
  isAuthed: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  solved_no_help: 'No help',
  solved_multiple_attempts: 'Multiple attempts',
  solved_with_hints: 'Used hints',
  solved_with_solution: 'Read solution',
  attempted_unsolved: 'Unsolved',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#4d8a68',
  medium: 'var(--accent)',
  hard: '#a8492f',
};

const PLATFORM_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  leetcode: { label: 'LC', bg: 'rgba(255,161,22,0.15)', fg: '#c97f0e' },
  codeforces: { label: 'CF', bg: 'rgba(30,120,220,0.15)', fg: '#3a7fd1' },
  atcoder: { label: 'AC', bg: 'rgba(120,100,220,0.15)', fg: '#6c5ce7' },
  other: { label: '?', bg: 'rgba(120,120,120,0.15)', fg: 'var(--text-muted)' },
};

const CF_RATINGS = Array.from({ length: 28 }, (_, i) => 800 + i * 100); // 800..3500

function PlatformBadge({ platform }: { platform: string }) {
  const badge = PLATFORM_BADGE[platform] ?? PLATFORM_BADGE.other;
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-5 rounded-full font-[var(--font-mono)] text-[0.6rem] font-semibold shrink-0"
      style={{ backgroundColor: badge.bg, color: badge.fg }}
      title={platform}
    >
      {badge.label}
    </span>
  );
}

const DIFFICULTY_RANK: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
const STATUS_RANK: Record<string, number> = {
  attempted_unsolved: 0,
  solved_with_solution: 1,
  solved_with_hints: 2,
  solved_multiple_attempts: 3,
  solved_no_help: 4,
};

type SortField = 'difficulty' | 'status' | 'time' | 'topic';
type SortDir = 'asc' | 'desc';

function latestAttempt(problem: ProblemWithAttempts) {
  return problem.attempts[0] ?? null;
}

function difficultyRank(difficulty: string): number {
  const numeric = Number(difficulty);
  if (!Number.isNaN(numeric)) return numeric;
  return DIFFICULTY_RANK[difficulty.toLowerCase()] ?? 99;
}

function statusRank(problem: ProblemWithAttempts): number {
  const latest = latestAttempt(problem);
  return latest ? (STATUS_RANK[latest.status] ?? -1) : -1;
}

function timeValue(problem: ProblemWithAttempts): number | null {
  return latestAttempt(problem)?.durationMinutes ?? null;
}

function topicValue(problem: ProblemWithAttempts): string {
  return problem.topics[0] ?? '';
}

/** Ascending/descending compare where missing values (no time logged) always sort last. */
function compareNullableNumbers(a: number | null, b: number | null, dir: SortDir): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return dir === 'asc' ? a - b : b - a;
}

export default function ProblemTable({ problems, isAuthed }: ProblemTableProps) {
  const [difficulty, setDifficulty] = useState('all');
  const [source, setSource] = useState('all');
  const [status, setStatus] = useState('all');
  const [nameFilter, setNameFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingAttemptId, setEditingAttemptId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'leetcode' | 'codeforces'>('all');

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      if (platformFilter !== 'all' && p.platform !== platformFilter) return false;
      if (difficulty !== 'all' && p.difficulty.toLowerCase() !== difficulty) return false;
      if (source !== 'all' && p.source !== source) return false;
      if (nameFilter && !p.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (topicFilter && !p.topics.some((t) => t.toLowerCase().includes(topicFilter.toLowerCase()))) {
        return false;
      }
      if (status !== 'all') {
        const latest = latestAttempt(p);
        if (status === 'unsolved' && latest) return false;
        if (status !== 'unsolved' && (!latest || latest.status !== status)) return false;
      }
      return true;
    });
  }, [problems, platformFilter, difficulty, source, status, nameFilter, topicFilter]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    const dirMul = sortDir === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case 'difficulty':
          return dirMul * (difficultyRank(a.difficulty) - difficultyRank(b.difficulty));
        case 'status':
          return dirMul * (statusRank(a) - statusRank(b));
        case 'time':
          return compareNullableNumbers(timeValue(a), timeValue(b), sortDir);
        case 'topic':
          return dirMul * topicValue(a).localeCompare(topicValue(b));
        default:
          return 0;
      }
    });
  }, [filtered, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  if (problems.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 text-[0.9rem] text-[var(--text-muted)]">
        Nothing logged yet. Attempt a problem, then log it.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-[0.75rem] text-[var(--text-muted)] font-[var(--font-mono)]">
          {sorted.length} problem{sorted.length === 1 ? '' : 's'}
        </div>
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
      </div>

      <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
        <table className="w-full border-collapse text-[0.85rem] min-w-[720px]">
          <thead>
            <tr className="bg-[var(--bg-card)] border-b border-[var(--border)]">
              <th className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase px-4 py-3">
                Problem
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort('difficulty')}
                  className="flex items-center gap-1 font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase hover:text-[var(--accent)]"
                >
                  Difficulty {sortField === 'difficulty' && (sortDir === 'asc' ? '▲' : '▼')}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort('topic')}
                  className="flex items-center gap-1 font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase hover:text-[var(--accent)]"
                >
                  Topics {sortField === 'topic' && (sortDir === 'asc' ? '▲' : '▼')}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort('status')}
                  className="flex items-center gap-1 font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase hover:text-[var(--accent)]"
                >
                  Status {sortField === 'status' && (sortDir === 'asc' ? '▲' : '▼')}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort('time')}
                  className="flex items-center gap-1 font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase hover:text-[var(--accent)]"
                >
                  Time {sortField === 'time' && (sortDir === 'asc' ? '▲' : '▼')}
                </button>
              </th>
              <th className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase px-4 py-3">
                Solution
              </th>
              <th className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.08em] uppercase px-4 py-3">
                {' '}
              </th>
            </tr>
            <tr className="bg-[var(--bg-card)] border-b border-[var(--border)]">
              <th className="px-4 pb-3">
                <input
                  type="text"
                  placeholder="Filter name…"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 text-[0.75rem] text-[var(--text)] font-normal normal-case tracking-normal"
                />
              </th>
              <th className="px-4 pb-3">
                <div className="flex gap-1 mb-1">
                  {(['all', 'leetcode', 'codeforces'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPlatformFilter(p);
                        setDifficulty('all');
                      }}
                      className={`flex-1 rounded px-1.5 py-0.5 text-[0.65rem] font-[var(--font-mono)] normal-case tracking-normal border ${
                        platformFilter === p
                          ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]'
                          : 'bg-[var(--bg)] text-[var(--text-muted)] border-[var(--border)]'
                      }`}
                    >
                      {p === 'all' ? 'All' : p === 'leetcode' ? 'LC' : 'CF'}
                    </button>
                  ))}
                </div>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 text-[0.75rem] text-[var(--text)] font-normal normal-case tracking-normal"
                >
                  <option value="all">All</option>
                  {platformFilter !== 'codeforces' && (
                    <>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </>
                  )}
                  {platformFilter !== 'leetcode' &&
                    CF_RATINGS.map((rating) => (
                      <option key={rating} value={String(rating)}>
                        {rating}
                      </option>
                    ))}
                </select>
              </th>
              <th className="px-4 pb-3">
                <input
                  type="text"
                  placeholder="Filter topic…"
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 text-[0.75rem] text-[var(--text)] font-normal normal-case tracking-normal"
                />
              </th>
              <th className="px-4 pb-3">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 text-[0.75rem] text-[var(--text)] font-normal normal-case tracking-normal"
                >
                  <option value="all">All</option>
                  <option value="unsolved">Unsolved</option>
                  <option value="solved_no_help">No help</option>
                  <option value="solved_multiple_attempts">Multiple attempts</option>
                  <option value="solved_with_hints">Used hints</option>
                  <option value="solved_with_solution">Read solution</option>
                </select>
              </th>
              <th className="px-4 pb-3" />
              <th className="px-4 pb-3" />
              <th className="px-4 pb-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((problem) => {
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
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={problem.platform} />
                        <a
                          href={problem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[var(--text)] no-underline hover:text-[var(--accent)]"
                        >
                          {problem.name}
                        </a>
                      </div>
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
                            {problem.attempts.map((attempt) => {
                              const wasEdited =
                                new Date(attempt.updatedAt).getTime() -
                                  new Date(attempt.solvedAt).getTime() >
                                2_000;
                              const isEditing = editingAttemptId === attempt.id;

                              if (isEditing) {
                                return (
                                  <EditAttemptForm
                                    key={attempt.id}
                                    attempt={attempt}
                                    problemId={problem.id}
                                    platform={problem.platform}
                                    onDone={() => setEditingAttemptId(null)}
                                  />
                                );
                              }

                              return (
                                <div
                                  key={attempt.id}
                                  className="bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-lg p-3"
                                >
                                  <div className="flex justify-between items-start gap-3 mb-1">
                                    <div className="font-[var(--font-mono)] text-[0.7rem] text-[var(--text-muted)]">
                                      {new Date(attempt.solvedAt).toLocaleDateString()} ·{' '}
                                      {STATUS_LABELS[attempt.status]}
                                      {attempt.durationMinutes ? ` · ${attempt.durationMinutes}m` : ''}
                                      {wasEdited && (
                                        <>
                                          {' '}
                                          · edited{' '}
                                          {new Date(attempt.updatedAt).toLocaleString()}
                                        </>
                                      )}
                                    </div>
                                    {isAuthed && (
                                      <button
                                        onClick={() => setEditingAttemptId(attempt.id)}
                                        className="font-[var(--font-mono)] text-[0.65rem] text-[var(--accent)] uppercase tracking-[0.06em] whitespace-nowrap"
                                      >
                                        Edit
                                      </button>
                                    )}
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
                              );
                            })}
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
