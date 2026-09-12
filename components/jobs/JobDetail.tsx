'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JobApplication } from '@/lib/db/jobs';
import { exportDescriptionToPdf } from '@/lib/jobs/pdf';
import type { JobAnalysis, ResumeScore } from '@/lib/jobs/types';

interface JobDetailProps {
  job: JobApplication;
  onEdit: () => void;
}

const IMPORTANCE_STYLE: Record<string, string> = {
  required: 'border-[var(--accent)] text-[var(--accent)]',
  preferred: 'border-[var(--border)] text-[var(--text)]',
  mentioned: 'border-[var(--border)] text-[var(--text-muted)]',
};

function scoreColor(score: number): string {
  if (score >= 80) return '#4d8a68';
  if (score >= 55) return 'var(--accent)';
  return '#a8492f';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-[var(--font-mono)] text-[0.65rem] text-[var(--accent)] tracking-[0.2em] uppercase">
        {title}
      </div>
      {children}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="border border-[var(--border)] rounded px-2 py-0.5 text-[0.72rem] text-[var(--text-muted)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 flex flex-col gap-1 text-[0.78rem] text-[var(--text-muted)] leading-[1.6]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function JobDetail({ job, onEdit }: JobDetailProps) {
  const router = useRouter();
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(job.analysis);
  const [score, setScore] = useState<ResumeScore | null>(job.resumeScore);
  const [busy, setBusy] = useState<'analyze' | 'score' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const hasDescription = job.description.trim().length >= 40;

  async function runAnalysis() {
    setBusy('analyze');
    setError(null);
    const res = await fetch('/api/jobs/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: job.description,
        positionName: job.positionName,
        company: job.company,
        applicationId: job.id,
      }),
    });
    const payload = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) {
      setError(payload?.error ?? 'Analysis failed.');
      return;
    }
    setAnalysis(payload.analysis);
    router.refresh();
  }

  async function runScore() {
    setBusy('score');
    setError(null);
    const res = await fetch('/api/jobs/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: job.id }),
    });
    const payload = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) {
      setError(payload?.error ?? 'Scoring failed.');
      return;
    }
    setScore(payload.resumeScore);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${job.positionName}"? This cannot be undone.`)) return;
    setBusy('delete');
    const res = await fetch(`/api/jobs/applications/${job.id}`, { method: 'DELETE' });
    setBusy(null);
    if (!res.ok) {
      setError('Could not delete.');
      return;
    }
    router.refresh();
  }

  async function handleExportPdf() {
    setExporting(true);
    setError(null);
    try {
      await exportDescriptionToPdf(job);
    } catch {
      setError('Could not generate the PDF.');
    }
    setExporting(false);
  }

  return (
    <div className="bg-[var(--bg-card-hover)] border-t border-[var(--border)] p-5 flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onEdit}
          className="border border-[var(--border)] rounded px-3 py-1.5 text-[0.75rem] text-[var(--text)] hover:border-[var(--accent)]"
        >
          Edit
        </button>
        {job.resumeFile && (
          <a
            href={`/api/jobs/files/${job.resumeFile.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[var(--border)] rounded px-3 py-1.5 text-[0.75rem] text-[var(--text)] hover:border-[var(--accent)]"
          >
            Resume ↗
          </a>
        )}
        {job.coverLetterFile && (
          <a
            href={`/api/jobs/files/${job.coverLetterFile.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[var(--border)] rounded px-3 py-1.5 text-[0.75rem] text-[var(--text)] hover:border-[var(--accent)]"
          >
            Cover letter ↗
          </a>
        )}
        <button
          onClick={handleDelete}
          disabled={busy === 'delete'}
          className="border border-[var(--border)] rounded px-3 py-1.5 text-[0.75rem] text-[var(--text-muted)] hover:border-red-400 hover:text-red-400 ml-auto disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {error && <div className="text-[0.78rem] text-red-400">{error}</div>}

      {job.notes && (
        <Section title="Notes">
          <p className="text-[0.8rem] text-[var(--text-muted)] leading-[1.7] whitespace-pre-wrap">
            {job.notes}
          </p>
        </Section>
      )}

      {/* Description: collapsed by default, expandable, exportable as a PDF so the
          posting survives being taken down. */}
      <Section title="Position description">
        {job.description ? (
          <div className="border border-[var(--border)] rounded bg-[var(--bg-card)]">
            <div className="flex items-center justify-between px-3 py-2 gap-3">
              <button
                onClick={() => setDescriptionOpen((open) => !open)}
                className="text-[0.78rem] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-2"
              >
                <span>{descriptionOpen ? '▾' : '▸'}</span>
                {descriptionOpen ? 'Hide' : 'Show'} full description
                <span className="opacity-70">
                  ({job.description.trim().split(/\s+/).length} words)
                </span>
              </button>
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="border border-[var(--border)] rounded px-3 py-1 text-[0.72rem] text-[var(--text)] hover:border-[var(--accent)] shrink-0 disabled:opacity-50"
              >
                {exporting ? 'Saving…' : 'Save as PDF ↓'}
              </button>
            </div>
            {descriptionOpen && (
              <pre className="px-3 pb-3 text-[0.75rem] text-[var(--text-muted)] leading-[1.65] whitespace-pre-wrap font-[var(--font-mono)] max-h-[420px] overflow-y-auto">
                {job.description}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-[0.78rem] text-[var(--text-muted)]">
            No description saved yet — paste one via Edit to unlock the analysis.
          </p>
        )}
      </Section>

      <Section title="What this posting screens on">
        {analysis ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              {analysis.topSkills.map((skill) => (
                <span
                  key={skill.name}
                  title={`${skill.importance} — ${skill.evidence}`}
                  className={`border rounded px-2 py-0.5 text-[0.72rem] ${
                    IMPORTANCE_STYLE[skill.importance] ?? IMPORTANCE_STYLE.mentioned
                  }`}
                >
                  {skill.name}
                  <span className="opacity-60 ml-1.5">{skill.importance[0].toUpperCase()}</span>
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {analysis.technologies.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[0.72rem] text-[var(--text)]">Technologies</div>
                  <Chips items={analysis.technologies} />
                </div>
              )}
              {analysis.mustHaves.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[0.72rem] text-[var(--text)]">Must-haves</div>
                  <Bullets items={analysis.mustHaves} />
                </div>
              )}
              {analysis.niceToHaves.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[0.72rem] text-[var(--text)]">Nice to have</div>
                  <Bullets items={analysis.niceToHaves} />
                </div>
              )}
              {analysis.keyResponsibilities.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[0.72rem] text-[var(--text)]">Responsibilities</div>
                  <Bullets items={analysis.keyResponsibilities} />
                </div>
              )}
            </div>

            {analysis.atsKeywords.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-[0.72rem] text-[var(--text)]">
                  Likely ATS keywords
                  <span className="text-[var(--text-muted)] ml-2 opacity-80">
                    the exact phrases worth mirroring
                  </span>
                </div>
                <Chips items={analysis.atsKeywords} />
              </div>
            )}

            <button
              onClick={runAnalysis}
              disabled={busy === 'analyze'}
              className="self-start text-[0.72rem] text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              {busy === 'analyze' ? 'Re-reading…' : 'Re-analyze'}
            </button>
          </div>
        ) : (
          <button
            onClick={runAnalysis}
            disabled={!hasDescription || busy === 'analyze'}
            className="self-start bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded font-semibold text-[0.78rem] tracking-[0.05em] hover:opacity-85 disabled:opacity-40"
          >
            {busy === 'analyze' ? 'Reading the posting…' : 'Curate the findings'}
          </button>
        )}
      </Section>

      <Section title="Resume vs. this posting">
        {score ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div
                className="font-[var(--font-serif)] text-[2.6rem] leading-none"
                style={{ color: scoreColor(score.atsScore) }}
              >
                {score.atsScore}
                <span className="text-[1rem] text-[var(--text-muted)]">/100</span>
              </div>
              <p className="text-[0.8rem] text-[var(--text-muted)] leading-[1.6] flex-1 min-w-[240px]">
                {score.verdict}
              </p>
            </div>

            {score.topActions.length > 0 && (
              <div className="flex flex-col gap-2 border-l-2 border-[var(--accent)] pl-3">
                <div className="text-[0.72rem] text-[var(--text)]">Do these before applying</div>
                <ol className="list-decimal pl-5 flex flex-col gap-1 text-[0.78rem] text-[var(--text-muted)] leading-[1.6]">
                  {score.topActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {score.matchedKeywords.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[0.72rem] text-[var(--text)]">Already covered</div>
                  <Chips items={score.matchedKeywords} />
                </div>
              )}
              {score.missingKeywords.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-[0.72rem] text-[var(--text)]">Missing — add if true</div>
                  <div className="flex flex-wrap gap-1.5">
                    {score.missingKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="border border-[#a8492f] text-[#a8492f] rounded px-2 py-0.5 text-[0.72rem]"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {score.bulletRewrites.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="text-[0.72rem] text-[var(--text)]">Tailored rewrites</div>
                {score.bulletRewrites.map((rewrite, i) => (
                  <div
                    key={i}
                    className="border border-[var(--border)] rounded bg-[var(--bg-card)] p-3 flex flex-col gap-2"
                  >
                    <div className="text-[0.75rem] text-[var(--text-muted)] line-through decoration-[var(--text-muted)]/40">
                      {rewrite.original}
                    </div>
                    <div className="text-[0.78rem] text-[var(--text)] leading-[1.6]">
                      {rewrite.improved}
                    </div>
                    <div className="text-[0.7rem] text-[var(--text-muted)] italic">
                      {rewrite.why}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {score.formattingIssues.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-[0.72rem] text-[var(--text)]">Parsing problems</div>
                <Bullets items={score.formattingIssues} />
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={runScore}
                disabled={busy === 'score'}
                className="text-[0.72rem] text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-50"
              >
                {busy === 'score' ? 'Re-scoring…' : 'Re-score'}
              </button>
              <span className="text-[0.68rem] text-[var(--text-muted)] opacity-70">
                Scored {new Date(score.scoredAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-start">
            <button
              onClick={runScore}
              disabled={!hasDescription || !job.resumeFile || busy === 'score'}
              className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded font-semibold text-[0.78rem] tracking-[0.05em] hover:opacity-85 disabled:opacity-40"
            >
              {busy === 'score' ? 'Grading the resume…' : 'Rate my resume'}
            </button>
            {(!hasDescription || !job.resumeFile) && (
              <span className="text-[0.72rem] text-[var(--text-muted)]">
                Needs {!job.resumeFile ? 'an attached resume' : ''}
                {!job.resumeFile && !hasDescription ? ' and ' : ''}
                {!hasDescription ? 'a pasted job description' : ''}.
              </span>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
