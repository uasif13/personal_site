'use client';

import { useEffect, useRef } from 'react';

export default function Experience() {
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

  const experiences = [
    {
      company: "Bader Lab — NJIT",
      role: "Research Assistant",
      location: "Newark, NJ",
      date: "Sep 2025 — Present",
    },
    {
      company: "OculoMotor Technologies",
      role: "Software Engineer Intern",
      location: "Newark, NJ · Healthcare Startup",
      date: "Oct 2024 — May 2025",
    },
    {
      company: "Bloomberg LP",
      role: "Software Engineer",
      location: "New York, NY",
      date: "Sep 2021 — Mar 2023",
    },
    {
      company: "Robust Field Autonomy Lab — Stevens",
      role: "Research Assistant",
      location: "Hoboken, NJ",
      date: "Aug 2019 — Mar 2020",
    },
  ];

  return (
    <>
      <div className="w-full h-[1px] bg-[var(--border)]"></div>
      <section id="experience" ref={sectionRef} className="fade-section px-6 sm:px-12 py-24">
        <div className="font-[var(--font-mono)] text-[0.7rem] text-[var(--accent)] tracking-[0.25em] uppercase mb-3">
          Experience
        </div>
        <h2 className="font-[var(--font-serif)] text-[clamp(2rem,4vw,3.5rem)] tracking-tight font-normal mb-12">
          Where I've worked
        </h2>

        <div className="max-w-[900px]">
          {experiences.map((exp, index) => (
            <div
              key={index}
              className={`border-l-2 border-[var(--border)] pl-8 relative transition-colors hover:border-[var(--accent)] group ${
                index !== experiences.length - 1 ? 'pb-12' : ''
              }`}
            >
              <div className="absolute left-[-5px] top-[6px] w-2 h-2 rounded-full bg-[var(--accent-dim)] border-2 border-[var(--bg)] transition-colors group-hover:bg-[var(--accent)]"></div>
              
              <div className="flex justify-between items-baseline flex-wrap gap-2 mb-1">
                <span className="font-[var(--font-serif)] text-2xl tracking-tight">
                  {exp.company}
                </span>
                <span className="font-[var(--font-mono)] text-[0.75rem] text-[var(--text-muted)] tracking-[0.05em]">
                  {exp.date}
                </span>
              </div>
              
              <div className="text-[0.95rem] text-[var(--accent)] font-medium mb-3">
                {exp.role}
              </div>
              
              <div className="text-[0.8rem] text-[var(--text-muted)]">
                {exp.location}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
