'use client';

import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-12 py-5 flex justify-between items-center backdrop-blur-[20px] bg-[rgba(10,10,12,0.8)] border-b border-[var(--border)]">
      <Link href="/" className="font-[var(--font-serif)] text-2xl text-[var(--accent)] no-underline tracking-tight">
        AU
      </Link>
      <div className="flex gap-8 items-center">
        <Link href="/#experience" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)] hidden sm:block">
          Experience
        </Link>
        <Link href="/#hackathons" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)] hidden sm:block">
          Hackathons
        </Link>
        <Link href="/blog" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)] hidden sm:block">
          Blog
        </Link>
        <Link href="/#contact" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)] hidden sm:block">
          Contact
        </Link>
        <a href="/resume_4_26.pdf" download className="bg-[var(--accent)] text-[var(--bg)] px-5 py-2 rounded font-semibold text-[0.8rem] tracking-[0.06em] transition-all hover:opacity-85 hover:-translate-y-px">
          Download Resume ↓
        </a>
      </div>
    </nav>
  );
}
