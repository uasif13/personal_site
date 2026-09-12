'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FileMeta, JobApplication } from '@/lib/db/jobs';
import { JOB_STATUSES, type JobAnalysis } from '@/lib/jobs/types';
import FileField from './FileField';

interface JobFormProps {
  /** Omit to create a new application. */
  existing?: JobApplication;
  onDone: () => void;
}

const inputClass =
  'bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem] w-full';
const labelClass = 'flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]';

export default function JobForm({ existing, onDone }: JobFormProps) {
  const router = useRouter();

  const [positionName, setPositionName] = useState(existing?.positionName ?? '');
  const [company, setCompany] = useState(existing?.company ?? '');
  const [positionLink, setPositionLink] = useState(existing?.positionLink ?? '');
  const [status, setStatus] = useState(existing?.status ?? 'to_apply');
  const [dateApplied, setDateApplied] = useState(existing?.dateApplied ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [yearsExperience, setYearsExperience] = useState(existing?.yearsExperience ?? '');
  const [skills, setSkills] = useState((existing?.skills ?? []).join(', '));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [resumeFile, setResumeFile] = useState<FileMeta | null>(existing?.resumeFile ?? null);
  const [coverLetterFile, setCoverLetterFile] = useState<FileMeta | null>(
    existing?.coverLetterFile ?? null
  );

  const [descriptionOpen, setDescriptionOpen] = useState(!existing);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(existing?.analysis ?? null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [autofilled, setAutofilled] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reads the pasted description and fills in years-of-experience and skills.
   * Both stay ordinary editable inputs afterwards — this seeds them, it doesn't
   * own them — so an existing hand-typed value is never silently overwritten.
   */
  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError(null);

    const res = await fetch('/api/jobs/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        positionName,
        company,
        applicationId: existing?.id ?? null,
      }),
    });
    const payload = await res.json().catch(() => null);
    setAnalyzing(false);

    if (!res.ok) {
      setAnalyzeError(payload?.error ?? 'Analysis failed.');
      return;
    }

    const result = payload.analysis as JobAnalysis;
    setAnalysis(result);
    if (!yearsExperience.trim()) setYearsExperience(result.yearsExperience);
    if (!skills.trim()) setSkills(result.topSkills.map((s) => s.name).join(', '));
    setAutofilled(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      positionName,
      company,
      positionLink: positionLink || null,
      status,
      // A date only means something once it's actually been sent off.
      dateApplied: status === 'to_apply' ? null : dateApplied || null,
      description,
      yearsExperience: yearsExperience || null,
      skills: skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      notes: notes || null,
      resumeFileId: resumeFile?.id ?? null,
      coverLetterFileId: coverLetterFile?.id ?? null,
    };

    const res = await fetch(
      existing ? `/api/jobs/applications/${existing.id}` : '/api/jobs/applications',
      {
        method: existing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    setSubmitting(false);

    if (!res.ok) {
      setError('Could not save. Are you still logged in?');
      return;
    }

    router.refresh();
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-lg p-5 flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={labelClass}>
          Position name *
          <input
            required
            value={positionName}
            onChange={(e) => setPositionName(e.target.value)}
            className={inputClass}
            placeholder="Software Engineer, Backend"
          />
        </label>

        <label className={labelClass}>
          Company
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
            placeholder="Acme Corp"
          />
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Position link
          <input
            type="url"
            value={positionLink}
            onChange={(e) => setPositionLink(e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </label>

        <label className={labelClass}>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {JOB_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Date applied
          <input
            type="date"
            value={dateApplied ?? ''}
            onChange={(e) => setDateApplied(e.target.value)}
            disabled={status === 'to_apply'}
            className={`${inputClass} disabled:opacity-40`}
          />
          {status === 'to_apply' && (
            <span className="text-[0.68rem] opacity-70">
              Set once the status moves off &ldquo;To apply&rdquo;.
            </span>
          )}
        </label>
      </div>

      {/* The description is long and pasted once, so it collapses out of the way
          after the fact rather than dominating the form. */}
      <div className="border border-[var(--border)] rounded">
        <button
          type="button"
          onClick={() => setDescriptionOpen((open) => !open)}
          className="w-full flex items-center justify-between px-3 py-2 text-[0.78rem] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <span>
            Position description
            {description && (
              <span className="ml-2 opacity-70">
                — {description.trim().split(/\s+/).length} words
              </span>
            )}
          </span>
          <span>{descriptionOpen ? '▾' : '▸'}</span>
        </button>

        {descriptionOpen && (
          <div className="px-3 pb-3 flex flex-col gap-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
              className={`${inputClass} font-[var(--font-mono)] text-[0.75rem] leading-[1.6]`}
              placeholder="Paste the full job description here…"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || description.trim().length < 40}
                className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded font-semibold text-[0.78rem] tracking-[0.05em] transition-all hover:opacity-85 disabled:opacity-40"
              >
                {analyzing ? 'Reading the posting…' : 'Analyze & auto-fill'}
              </button>
              <span className="text-[0.7rem] text-[var(--text-muted)]">
                Fills years of experience and skills below — both stay editable.
              </span>
            </div>

            {analyzeError && <div className="text-[0.75rem] text-red-400">{analyzeError}</div>}

            {analysis && autofilled && (
              <div className="text-[0.72rem] text-[var(--text-muted)] border-l-2 border-[var(--accent)] pl-3">
                Found {analysis.topSkills.length} key skills, {analysis.technologies.length}{' '}
                technologies, seniority &ldquo;{analysis.seniority}&rdquo;. Full breakdown
                appears on the row once saved.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={labelClass}>
          Years of experience
          <input
            value={yearsExperience ?? ''}
            onChange={(e) => setYearsExperience(e.target.value)}
            className={inputClass}
            placeholder="Auto-filled from the description"
          />
        </label>

        <label className={labelClass}>
          Skills (comma separated)
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className={inputClass}
            placeholder="Auto-filled from the description"
          />
        </label>

        <FileField
          label="Resume used *"
          kind="resume"
          value={resumeFile}
          onChange={setResumeFile}
          hint="A PDF gets read directly when scoring against this posting."
        />

        <FileField
          label="Cover letter (optional)"
          kind="cover_letter"
          value={coverLetterFile}
          onChange={setCoverLetterFile}
        />
      </div>

      <label className={labelClass}>
        Notes (optional)
        <textarea
          value={notes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Referral, recruiter name, salary range, follow-up date…"
        />
      </label>

      {error && <div className="text-[0.75rem] text-red-400">{error}</div>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded font-semibold text-[0.8rem] tracking-[0.06em] transition-all hover:opacity-85 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : existing ? 'Save changes' : 'Add application'}
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
