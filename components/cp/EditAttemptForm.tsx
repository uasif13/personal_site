'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Attempt } from '@/lib/db/queries';

interface EditAttemptFormProps {
  attempt: Attempt;
  problemId: number;
  platform: string;
  onDone: () => void;
}

const PLATFORMS = ['leetcode', 'codeforces', 'atcoder', 'other'];

const STATUS_OPTIONS = [
  { value: 'solved_no_help', label: 'Solved — no help' },
  { value: 'solved_multiple_attempts', label: 'Solved — multiple attempts' },
  { value: 'solved_with_hints', label: 'Solved — used hints' },
  { value: 'solved_with_solution', label: 'Solved — read solution' },
  { value: 'attempted_unsolved', label: 'Attempted — unsolved' },
];

export default function EditAttemptForm({
  attempt,
  problemId,
  platform: initialPlatform,
  onDone,
}: EditAttemptFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(attempt.status);
  const [platform, setPlatform] = useState(initialPlatform);
  const [duration, setDuration] = useState(attempt.durationMinutes?.toString() ?? '');
  const [solutionUrl, setSolutionUrl] = useState(attempt.solutionUrl ?? '');
  const [notes, setNotes] = useState(attempt.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Platform lives on the problem, so it's a separate call — only made when
    // it actually changed, to keep a plain note edit from rewriting the problem.
    if (platform !== initialPlatform) {
      const problemRes = await fetch(`/api/cp/problems/${problemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      if (!problemRes.ok) {
        setSubmitting(false);
        setError('Could not change the platform. Are you still logged in?');
        return;
      }
    }

    const res = await fetch(`/api/cp/attempts/${attempt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        durationMinutes: duration ? Number(duration) : null,
        solutionUrl: solutionUrl || null,
        notes: notes || null,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError('Could not save changes. Are you still logged in?');
      return;
    }

    router.refresh();
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-lg p-4 flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
          Platform
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {platform !== initialPlatform && (
            <span className="text-[0.7rem] text-[var(--text-muted)]">
              Applies to the problem itself, so every attempt on it moves too.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
          Time taken (minutes)
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
            placeholder="e.g. 32"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
        Link to your solution
        <input
          type="url"
          value={solutionUrl}
          onChange={(e) => setSolutionUrl(e.target.value)}
          className="bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          placeholder="https://github.com/..."
        />
      </label>

      <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
        Strategy notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          placeholder="What was the approach? What did you miss at first?"
        />
      </label>

      {error && <div className="text-[0.75rem] text-red-400">{error}</div>}

      <div className="flex gap-3 mt-1">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded font-semibold text-[0.8rem] tracking-[0.06em] transition-all hover:opacity-85 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-[var(--text-muted)] px-4 py-2 rounded font-medium text-[0.8rem] hover:text-[var(--text)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
