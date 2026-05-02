'use client';

import { useEffect, useRef } from 'react';

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.08 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="w-full h-[1px] bg-[var(--border)]"></div>
      <section id="contact" ref={sectionRef} className="fade-section text-center px-12 py-32">
        <div className="font-[var(--font-mono)] text-[0.7rem] text-[var(--accent)] tracking-[0.25em] uppercase mb-3">
          Contact
        </div>
        <h2 className="font-[var(--font-serif)] text-[clamp(2rem,4vw,3.5rem)] tracking-tight font-normal max-w-[600px] mx-auto mb-4">
          Let's build something together
        </h2>
        <p className="text-[var(--text-muted)] text-base mb-10">
          Open to full-stack, AI/ML, and software engineering roles.
        </p>
        <div className="flex justify-center gap-8 flex-wrap">
          <a
            href="mailto:uasif13@gmail.com"
            className="text-[var(--text)] no-underline text-[0.85rem] font-medium px-6 py-3 border border-[var(--border)] rounded flex items-center gap-2 transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] hover:-translate-y-[2px]"
          >
            ✉ uasif13@gmail.com
          </a>
          <a
            href="https://www.linkedin.com/in/asifu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text)] no-underline text-[0.85rem] font-medium px-6 py-3 border border-[var(--border)] rounded flex items-center gap-2 transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] hover:-translate-y-[2px]"
          >
            in LinkedIn
          </a>
          <a
            href="https://github.com/uasif13"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text)] no-underline text-[0.85rem] font-medium px-6 py-3 border border-[var(--border)] rounded flex items-center gap-2 transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] hover:-translate-y-[2px]"
          >
            ⌘ GitHub
          </a>
          <a
            href="/resume_4_26.pdf"
            download
            className="text-[var(--text)] no-underline text-[0.85rem] font-medium px-6 py-3 border border-[var(--border)] rounded flex items-center gap-2 transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] hover:-translate-y-[2px]"
          >
            ↓ Resume
          </a>
        </div>
      </section>
    </>
  );
}
