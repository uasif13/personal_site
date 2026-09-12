'use client';

import { Fragment, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JobApplication } from '@/lib/db/jobs';
import { JOB_STATUSES, statusLabel } from '@/lib/jobs/types';
import JobDetail from './JobDetail';
import JobForm from './JobForm';

interface JobTableProps {
  applications: JobApplication[];
}

const STATUS_COLOR: Record<string, string> = {
  to_apply: 'var(--text-muted)',
  applied: 'var(--accent)',
  interviewing: '#3f7fa8',
  rejected: '#a8492f',
  accepted: '#4d8a68',
};

/** Matches the scorecard in JobDetail so the same number reads the same way. */
function scoreColor(score: number): string {
  if (score >= 80) return '#4d8a68';
  if (score >= 55) return 'var(--accent)';
  return '#a8492f';
}

export default function JobTable({ applications }: JobTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return applications.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        job.positionName.toLowerCase().includes(needle) ||
        job.company.toLowerCase().includes(needle) ||
        job.skills.some((skill) => skill.toLowerCase().includes(needle))
      );
    });
  }, [applications, statusFilter, search]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const job of applications) {
      map.set(job.status, (map.get(job.status) ?? 0) + 1);
    }
    return map;
  }, [applications]);

  /** Changing status straight from the table is the most common edit by far. */
  async function changeStatus(job: JobApplication, status: string) {
    const patch: Record<string, unknown> = { status };
    // Stamp the application date the first time it leaves the to-apply column.
    if (status !== 'to_apply' && !job.dateApplied) {
      patch.dateApplied = new Date().toISOString().slice(0, 10);
    }
    await fetch(`/api/jobs/applications/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search position, company, or skill…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[0.8rem] text-[var(--text)] flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[0.8rem] text-[var(--text)]"
        >
          <option value="all">All statuses ({applications.length})</option>
          {JOB_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label} ({counts.get(s.value) ?? 0})
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setAdding((open) => !open);
            setEditingId(null);
          }}
          className="bg-[var(--accent)] text-[var(--bg)] px-5 py-2 rounded font-semibold text-[0.8rem] tracking-[0.06em] hover:opacity-85 whitespace-nowrap"
        >
          {adding ? 'Cancel' : '+ Add a job'}
        </button>
      </div>

      {adding && <JobForm onDone={() => setAdding(false)} />}

      {applications.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 text-[0.9rem] text-[var(--text-muted)]">
          Nothing tracked yet. Add the first job you&apos;re planning to apply to.
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-[var(--bg-card)] border-b border-[var(--border)]">
                  {['Position', 'Status', 'Applied', 'YOE', 'Skills', 'Files', ''].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="text-left font-[var(--font-mono)] text-[0.65rem] text-[var(--text-muted)] tracking-[0.15em] uppercase px-4 py-3 font-medium"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => {
                  const expanded = expandedId === job.id;
                  return (
                    <Fragment key={job.id}>
                      <tr
                        className={`border-b border-[var(--border)] ${
                          expanded ? 'bg-[var(--bg-card-hover)]' : 'bg-[var(--bg-card)]'
                        }`}
                      >
                        <td className="px-4 py-3 align-top">
                          <button
                            onClick={() => setExpandedId(expanded ? null : job.id)}
                            className="text-left text-[0.85rem] text-[var(--text)] hover:text-[var(--accent)]"
                          >
                            {job.positionName}
                          </button>
                          <div className="text-[0.72rem] text-[var(--text-muted)] flex items-center gap-2">
                            {job.company || '—'}
                            {job.positionLink && (
                              <a
                                href={job.positionLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--accent)] hover:underline"
                              >
                                ↗
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <select
                            value={job.status}
                            onChange={(e) => changeStatus(job, e.target.value)}
                            className="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-[0.75rem] cursor-pointer"
                            style={{ color: STATUS_COLOR[job.status] }}
                          >
                            {JOB_STATUSES.map((s) => (
                              <option key={s.value} value={s.value} className="text-[var(--text)]">
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-3 align-top text-[0.78rem] text-[var(--text-muted)] whitespace-nowrap">
                          {job.dateApplied ?? '—'}
                        </td>

                        <td className="px-4 py-3 align-top text-[0.78rem] text-[var(--text-muted)]">
                          {job.yearsExperience ?? '—'}
                        </td>

                        <td className="px-4 py-3 align-top max-w-[260px]">
                          <div className="flex flex-wrap gap-1">
                            {job.skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="border border-[var(--border)] rounded px-1.5 py-0.5 text-[0.68rem] text-[var(--text-muted)]"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 4 && (
                              <span className="text-[0.68rem] text-[var(--text-muted)] px-1 py-0.5">
                                +{job.skills.length - 4}
                              </span>
                            )}
                            {job.skills.length === 0 && (
                              <span className="text-[0.72rem] text-[var(--text-muted)]">—</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top text-[0.72rem] whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className={job.resumeFile ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}>
                              {job.resumeFile ? 'Resume ✓' : 'No resume'}
                            </span>
                            {job.coverLetterFile && (
                              <span className="text-[var(--text-muted)]">Cover letter ✓</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                          {job.resumeScore && (
                            <span
                              className="font-[var(--font-mono)] text-[0.78rem] mr-3"
                              style={{ color: scoreColor(job.resumeScore.atsScore) }}
                              title={`ATS score: ${job.resumeScore.atsScore}/100`}
                            >
                              {job.resumeScore.atsScore}
                            </span>
                          )}
                          <button
                            onClick={() => setExpandedId(expanded ? null : job.id)}
                            className="text-[0.72rem] text-[var(--text-muted)] hover:text-[var(--accent)]"
                          >
                            {expanded ? 'Close' : 'Open'}
                          </button>
                        </td>
                      </tr>

                      {expanded && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            {editingId === job.id ? (
                              <div className="p-5 bg-[var(--bg-card-hover)] border-t border-[var(--border)]">
                                <JobForm existing={job} onDone={() => setEditingId(null)} />
                              </div>
                            ) : (
                              <JobDetail job={job} onEdit={() => setEditingId(job.id)} />
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
      )}

      {applications.length > 0 && filtered.length === 0 && (
        <div className="text-[0.85rem] text-[var(--text-muted)]">
          No applications match that filter.
        </div>
      )}
    </div>
  );
}
