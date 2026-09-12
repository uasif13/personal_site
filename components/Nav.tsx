'use client';

import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-[20px] bg-[var(--nav-bg)] border-b border-[var(--border)]">
      <div className="px-6 sm:px-12 py-5 flex justify-between items-center">
        <Link href="/" className="font-[var(--font-serif)] text-2xl text-[var(--accent)] no-underline tracking-tight" onClick={closeMenu}>
          AU
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/#experience" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]">
            Experience
          </Link>
          <Link href="/#hackathons" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]">
            Hackathons
          </Link>
          <Link href="/blog" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]">
            Blog
          </Link>
          <Link href="/cp" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]">
            CP Tracker
          </Link>
          <Link href="/jobs" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]">
            Jobs
          </Link>
          <Link href="/#contact" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]">
            Contact
          </Link>
          <a href="/resume_4_26.pdf" download className="bg-[var(--accent)] text-[var(--bg)] px-5 py-2 rounded font-semibold text-[0.8rem] tracking-[0.06em] transition-all hover:opacity-85 hover:-translate-y-px">
            Download Resume ↓
          </a>
          <ThemeToggle className="text-lg leading-none" />
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={toggleMenu}
          className="md:hidden flex flex-col gap-1.5 w-7 h-7 justify-center items-center"
          aria-label="Toggle menu"
        >
          <span className={`w-6 h-0.5 bg-[var(--text)] transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-[var(--text)] transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-[var(--text)] transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 flex flex-col gap-4 border-t border-[var(--border)]">
          <Link 
            href="/#experience" 
            className="text-[var(--text-muted)] no-underline text-[0.9rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)] pt-4"
            onClick={closeMenu}
          >
            Experience
          </Link>
          <Link 
            href="/#hackathons" 
            className="text-[var(--text-muted)] no-underline text-[0.9rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]"
            onClick={closeMenu}
          >
            Hackathons
          </Link>
          <Link
            href="/blog"
            className="text-[var(--text-muted)] no-underline text-[0.9rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]"
            onClick={closeMenu}
          >
            Blog
          </Link>
          <Link
            href="/cp"
            className="text-[var(--text-muted)] no-underline text-[0.9rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]"
            onClick={closeMenu}
          >
            CP Tracker
          </Link>
          <Link
            href="/jobs"
            className="text-[var(--text-muted)] no-underline text-[0.9rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]"
            onClick={closeMenu}
          >
            Jobs
          </Link>
          <Link
            href="/#contact"
            className="text-[var(--text-muted)] no-underline text-[0.9rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-[var(--accent)]"
            onClick={closeMenu}
          >
            Contact
          </Link>
          <a
            href="/resume_4_26.pdf"
            download
            className="bg-[var(--accent)] text-[var(--bg)] px-5 py-2.5 rounded font-semibold text-[0.85rem] tracking-[0.06em] transition-all hover:opacity-85 text-center"
            onClick={closeMenu}
          >
            Download Resume ↓
          </a>
          <div className="flex items-center gap-2 text-[0.9rem] font-medium tracking-[0.08em] uppercase text-[var(--text-muted)]">
            Theme
            <ThemeToggle className="text-lg leading-none" />
          </div>
        </div>
      </div>
    </nav>
  );
}
