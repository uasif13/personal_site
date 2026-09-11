'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { DueReview } from '@/lib/db/queries';
import { categorySlug, type Neetcode250Problem } from '@/lib/cp/neetcode250';
import { codeforcesUrl, type CodeforcesProblem } from '@/lib/cp/codeforces';
import LogAttemptForm from './LogAttemptForm';

interface RecommendationsProps {
  dueReviews: DueReview[];
  newSuggestions: Neetcode250Problem[];
  cfSuggestions: CodeforcesProblem[];
  isAuthed: boolean;
}

function daysOverdue(nextReviewDate: Date | string): number {
  const due = new Date(nextReviewDate).getTime();
  const diff = Date.now() - due;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

interface SuggestionCardProps {
  eyebrow: string;
  heading: string;
  children: ReactNode;
}

function SuggestionCard({ eyebrow, heading, children }: SuggestionCardProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
      <div className="font-[var(--font-mono)] text-[0.65rem] text-[var(--accent)] tracking-[0.15em] uppercase mb-1">
        {eyebrow}
      </div>
      <h2 className="font-[var(--font-serif)] text-[1.4rem] tracking-tight font-normal mb-4">
        {heading}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

interface LogLinkQuery {
  [key: string]: string | undefined;
  name: string;
  url: string;
  platform: string;
  source: string;
  difficulty: string;
  topics: string;
  cfRating?: string;
}

function SuggestionRow({
  name,
  href,
  subtitle,
  logQuery,
  isAuthed,
}: {
  name: string;
  href: string;
  subtitle: string;
  logQuery: LogLinkQuery;
  isAuthed: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-3">
      <div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.85rem] font-medium text-[var(--text)] no-underline hover:text-[var(--accent)]"
        >
          {name}
        </a>
        <div className="text-[0.7rem] text-[var(--text-muted)] mt-0.5">{subtitle}</div>
      </div>
      {isAuthed && (
        <Link
          href={{ pathname: '/cp/admin/log', query: logQuery }}
          className="font-[var(--font-mono)] text-[0.65rem] text-[var(--accent)] uppercase tracking-[0.06em] whitespace-nowrap no-underline"
        >
          Log this
        </Link>
      )}
    </div>
  );
}

export default function Recommendations({
  dueReviews,
  newSuggestions,
  cfSuggestions,
  isAuthed,
}: RecommendationsProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (dueReviews.length === 0 && newSuggestions.length === 0 && cfSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      {dueReviews.length > 0 && (
        <SuggestionCard eyebrow="Spaced repetition" heading="Due for review">
          {dueReviews.map(({ review, problem, lastAttempt }) => {
            const overdue = daysOverdue(review.nextReviewDate);
            const isExpanded = expandedId === problem.id;
            return (
              <div key={problem.id}>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.85rem] font-medium text-[var(--text)] no-underline hover:text-[var(--accent)]"
                    >
                      {problem.name}
                    </a>
                    <div className="text-[0.7rem] text-[var(--text-muted)] mt-0.5">
                      {lastAttempt
                        ? `Last solved ${new Date(lastAttempt.solvedAt).toLocaleDateString()}`
                        : 'No prior attempt on record'}
                      {overdue > 0 ? ` · ${overdue}d overdue` : ' · due today'}
                    </div>
                  </div>
                  {isAuthed && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : problem.id)}
                      className="font-[var(--font-mono)] text-[0.65rem] text-[var(--accent)] uppercase tracking-[0.06em] whitespace-nowrap"
                    >
                      {isExpanded ? 'Close' : 'Log attempt'}
                    </button>
                  )}
                </div>
                {isExpanded && (
                  <LogAttemptForm problemId={problem.id} onDone={() => setExpandedId(null)} />
                )}
              </div>
            );
          })}
        </SuggestionCard>
      )}

      {newSuggestions.length > 0 && (
        <SuggestionCard eyebrow="NeetCode 250" heading="Try next">
          {newSuggestions.map((p) => (
            <SuggestionRow
              key={p.leetcode_url}
              name={p.name}
              href={p.leetcode_url}
              subtitle={`${p.difficulty} · ${p.category}`}
              isAuthed={isAuthed}
              logQuery={{
                name: p.name,
                url: p.leetcode_url,
                platform: 'leetcode',
                source: 'neetcode250',
                difficulty: p.difficulty,
                topics: categorySlug(p.category),
              }}
            />
          ))}
        </SuggestionCard>
      )}

      {cfSuggestions.length > 0 && (
        <SuggestionCard eyebrow="Codeforces" heading="Try next">
          {cfSuggestions.map((p) => {
            const href = codeforcesUrl(p);
            return (
              <SuggestionRow
                key={href}
                name={p.name}
                href={href}
                subtitle={`${p.rating} · ${p.tags.join(', ')}`}
                isAuthed={isAuthed}
                logQuery={{
                  name: p.name,
                  url: href,
                  platform: 'codeforces',
                  source: 'codeforces',
                  difficulty: String(p.rating),
                  topics: p.tags.join(', '),
                  cfRating: String(p.rating),
                }}
              />
            );
          })}
        </SuggestionCard>
      )}
    </div>
  );
}
