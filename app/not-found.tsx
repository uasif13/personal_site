import Nav from '@/components/Nav';
import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-[600px]">
          <h1 className="font-[var(--font-serif)] text-[8rem] leading-none text-[var(--accent)] mb-4">
            404
          </h1>
          <h2 className="font-[var(--font-serif)] text-[2rem] mb-4">
            Page Not Found
          </h2>
          <p className="text-[var(--text-muted)] text-[1rem] mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--bg)] px-6 py-3 rounded font-medium transition-all hover:opacity-85 hover:-translate-y-px"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </>
  );
}
