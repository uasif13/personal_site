'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLATFORMS = ['leetcode', 'codeforces', 'atcoder', 'other'];
const SOURCES = ['neetcode250', 'codeforces', 'youkn0wwho', 'custom'];
const STATUS_OPTIONS = [
  { value: 'solved_no_help', label: 'Solved — no help' },
  { value: 'solved_multiple_attempts', label: 'Solved — multiple attempts' },
  { value: 'solved_with_hints', label: 'Solved — used hints' },
  { value: 'solved_with_solution', label: 'Solved — read solution' },
  { value: 'attempted_unsolved', label: 'Attempted — unsolved' },
];

export interface LogProblemFormInitial {
  name?: string;
  url?: string;
  platform?: string;
  source?: string;
  difficulty?: string;
  topics?: string;
  cfRating?: string;
}

export default function LogProblemForm({ initial }: { initial?: LogProblemFormInitial }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [platform, setPlatform] = useState(initial?.platform ?? 'leetcode');
  const [source, setSource] = useState(initial?.source ?? 'custom');
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? '');
  const [topics, setTopics] = useState(initial?.topics ?? '');
  const [cfRating, setCfRating] = useState(initial?.cfRating ?? '');
  const [status, setStatus] = useState('solved_no_help');
  const [duration, setDuration] = useState('');
  const [solutionUrl, setSolutionUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [draftBlogPost, setDraftBlogPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const res = await fetch('/api/cp/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        url,
        platform,
        source,
        difficulty,
        topics: topics
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        cfRating: cfRating ? Number(cfRating) : null,
        status,
        durationMinutes: duration ? Number(duration) : null,
        solutionUrl: solutionUrl || null,
        notes: notes || null,
        draftBlogPost,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError('Could not log this problem. Check the fields and try again.');
      return;
    }

    setName('');
    setUrl('');
    setDifficulty('');
    setTopics('');
    setCfRating('');
    setDuration('');
    setSolutionUrl('');
    setNotes('');
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-[520px]">
      <div className="text-[0.7rem] font-[var(--font-mono)] text-[var(--accent-dim)] tracking-[0.1em] uppercase">
        The problem
      </div>

      <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
        />
      </label>

      <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
        Problem URL
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
          Platform
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
          Source
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
          Difficulty
          <input
            required
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            placeholder="Easy / Medium / Hard / 1900"
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          />
        </label>

        <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
          CF rating (optional)
          <input
            type="number"
            value={cfRating}
            onChange={(e) => setCfRating(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
        Topics (comma-separated)
        <input
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="graphs, shortest-path"
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
        />
      </label>

      <div className="text-[0.7rem] font-[var(--font-mono)] text-[var(--accent-dim)] tracking-[0.1em] uppercase mt-2">
        Your attempt
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
          Time taken (minutes)
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
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
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          placeholder="https://github.com/..."
        />
      </label>

      <label className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
        Strategy notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]"
          placeholder="What was the approach? What did you miss at first?"
        />
      </label>

      <label className="flex items-center gap-2 text-[0.75rem] text-[var(--text-muted)]">
        <input
          type="checkbox"
          checked={draftBlogPost}
          onChange={(e) => setDraftBlogPost(e.target.checked)}
        />
        Draft a blog post from these notes
      </label>

      {error && <div className="text-[0.8rem] text-red-400">{error}</div>}
      {success && <div className="text-[0.8rem] text-[#64b48c]">Logged.</div>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-[var(--accent)] text-[var(--bg)] px-5 py-2.5 rounded font-semibold text-[0.85rem] tracking-[0.06em] transition-all hover:opacity-85 disabled:opacity-50"
      >
        {submitting ? 'Logging…' : 'Log problem'}
      </button>
    </form>
  );
}
