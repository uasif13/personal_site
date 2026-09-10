import Nav from '@/components/Nav';
import LogProblemForm from '@/components/cp/LogProblemForm';

export const metadata = {
  title: 'Log a Problem — CP Tracker',
};

export default function LogProblemPage() {
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
          <LogProblemForm />
        </div>
      </main>
    </>
  );
}
