'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/cp/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError('Incorrect password.');
      return;
    }

    router.push(searchParams.get('next') || '/cp');
    router.refresh();
  }

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 sm:px-12 flex justify-center">
      <div className="max-w-[400px] w-full">
        <h1 className="font-[var(--font-serif)] text-[2.5rem] tracking-tight font-normal mb-8">
          CP Tracker Login
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2.5 text-[0.9rem] text-[var(--text)]"
          />
          {error && <div className="text-[0.8rem] text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-[var(--accent)] text-[var(--bg)] px-5 py-2.5 rounded font-semibold text-[0.85rem] tracking-[0.06em] transition-all hover:opacity-85 disabled:opacity-50"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function CpLoginPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  );
}
