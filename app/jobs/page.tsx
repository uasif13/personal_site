import Nav from '@/components/Nav';
import JobTable from '@/components/jobs/JobTable';
import { getAllApplications, type JobApplication } from '@/lib/db/jobs';
import { JOB_STATUSES } from '@/lib/jobs/types';

export const metadata = {
  title: 'Job Tracker',
  // This page is private (see middleware.ts) — keep it out of search results too.
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  let applications: JobApplication[] = [];
  let dbError = false;

  try {
    applications = await getAllApplications();
  } catch {
    dbError = true;
  }

  const counts = new Map<string, number>();
  for (const job of applications) {
    counts.set(job.status, (counts.get(job.status) ?? 0) + 1);
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-24 px-6 sm:px-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="font-[var(--font-mono)] text-[0.7rem] text-[var(--accent)] tracking-[0.25em] uppercase mb-3">
            Private
          </div>
          <h1 className="font-[var(--font-serif)] text-[clamp(2rem,4vw,3.5rem)] tracking-tight font-normal mb-4">
            Job Tracker
          </h1>
          <p className="text-[0.9rem] text-[var(--text-muted)] leading-[1.7] mb-10 max-w-[640px]">
            Every application in one place. Paste a job description and it gets read
            for you — the skills and years of experience it screens on fill themselves
            in, and your resume gets graded against it with specific edits to make
            before you hit submit.
          </p>

          {dbError ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 text-[0.9rem] text-[var(--text-muted)]">
              Could not reach the database. Check that{' '}
              <code className="font-[var(--font-mono)] text-[var(--accent)]">DATABASE_URL</code>{' '}
              is set and that{' '}
              <code className="font-[var(--font-mono)] text-[var(--accent)]">npm run db:push</code>{' '}
              has been run.
            </div>
          ) : (
            <>
              {applications.length > 0 && (
                <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-[var(--border)]">
                  {JOB_STATUSES.map((status) => (
                    <div key={status.value}>
                      <div className="font-[var(--font-serif)] text-[1.8rem] leading-none">
                        {counts.get(status.value) ?? 0}
                      </div>
                      <div className="font-[var(--font-mono)] text-[0.62rem] text-[var(--text-muted)] tracking-[0.15em] uppercase mt-1">
                        {status.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <JobTable applications={applications} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
