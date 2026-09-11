import Nav from '@/components/Nav';
import LogProblemForm from '@/components/cp/LogProblemForm';

export const metadata = {
  title: 'Log a Problem — CP Tracker',
};

interface LogProblemPageProps {
  searchParams: Promise<{
    name?: string;
    url?: string;
    platform?: string;
    source?: string;
    difficulty?: string;
    topics?: string;
    cfRating?: string;
  }>;
}

export default async function LogProblemPage({ searchParams }: LogProblemPageProps) {
  const params = await searchParams;

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-24 px-6 sm:px-12">
        <div className="max-w-[640px] mx-auto">
          <h1 className="font-[var(--font-serif)] text-[2.5rem] tracking-tight font-normal mb-2">
            Log a problem
          </h1>
          <p className="text-[0.85rem] text-[var(--text-muted)] mb-8">
            Problems only enter the tracker once you&apos;ve actually attempted them —
            fill in what you solved and how it went.
          </p>
          <LogProblemForm initial={params} />
        </div>
      </main>
    </>
  );
}
