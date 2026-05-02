'use client';

import { useEffect, useRef } from 'react';

export default function Hackathons() {
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

  const hackathons = [
    {
      badge: "🏆 1st Place",
      badgeClass: "badge-gold",
      name: "GrannyShield",
      event: "Generative Media Hackathon · April 2026",
      description: "Real-time phone scam intervention system. Hybrid FAISS/LLM backend for live speech-to-text classification with a Tavus conversational avatar that visually disrupts fraudulent calls.",
      tech: ["FAISS", "LLM", "Tavus", "Speech-to-Text"],
      link: "https://github.com/TylerL35/GrannyShield",
    },
    {
      badge: "🏆 Winner",
      badgeClass: "badge-gold",
      name: "HireSync",
      event: "Google × Columbia Hackathon · March 2026",
      description: "AI avatar recruiting platform using streaming avatars for automated candidate interviews with Gemini-powered evaluation and agent workflows.",
      tech: ["React", "TypeScript", "Gemini", "HeyGen", "GCP", "Firestore"],
      link: "https://github.com/albertlieyingadrian/showup-avatar",
    },
    {
      badge: "🥉 3rd Place",
      badgeClass: "badge-silver",
      name: "RA Voice Assistant",
      event: "Stevens Health Hackathon · Nov 2019",
      description: "Alexa-powered app for Rheumatoid Arthritis patients — voice-driven health tracking and medication reminders. Selected from 200 applicants.",
      tech: ["Flask", "PostgreSQL", "Alexa SDK"],
      link: "https://github.com/uasif13",
    },
    {
      badge: "💰 $1K Grant + $5K AWS",
      badgeClass: "badge-special",
      name: "Smart Group Scheduler",
      event: "Princeton ReHack · Nov 2019",
      description: "NLP-powered app that automated scheduling in group chats. Recognized by 1517 Fund out of 20 teams with a grant and AWS credit to pursue the venture.",
      tech: ["NLP", "Python", "AWS"],
      link: "https://github.com/uasif13",
    },
    {
      badge: "🥉 3rd Place — Mental Health",
      badgeClass: "badge-silver",
      name: "Relationship Counseling App",
      event: "MIT NYC Grand Hack · Nov 2019",
      description: "Millennial-focused relationship counseling app. Pitched to Deerfield Management, placed 3rd out of 20 teams in the Mental Health track.",
      tech: ["React", "Node.js"],
      link: "https://github.com/uasif13",
    },
  ];

  return (
    <>
      <div className="w-full h-[1px] bg-[var(--border)]"></div>
      <section id="hackathons" ref={sectionRef} className="fade-section px-6 sm:px-12 py-24">
        <div className="font-[var(--font-mono)] text-[0.7rem] text-[var(--accent)] tracking-[0.25em] uppercase mb-3">
          Hackathons
        </div>
        <h2 className="font-[var(--font-serif)] text-[clamp(2rem,4vw,3.5rem)] tracking-tight font-normal mb-12">
          Competition projects
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-6 max-w-[1200px]">
          {hackathons.map((hack, index) => (
            <div
              key={index}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 transition-all duration-[350ms] ease-in-out relative overflow-hidden group hover:border-[var(--accent-dim)] hover:bg-[var(--bg-card-hover)] hover:-translate-y-[3px]"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--accent)] to-transparent opacity-0 transition-opacity duration-[350ms] group-hover:opacity-100"></div>
              
              <span className={`inline-block font-[var(--font-mono)] text-[0.65rem] tracking-[0.12em] uppercase px-[0.7rem] py-[0.3rem] rounded-[3px] mb-4 ${
                hack.badgeClass === 'badge-gold' ? 'bg-[rgba(201,168,76,0.15)] text-[var(--accent)]' :
                hack.badgeClass === 'badge-silver' ? 'bg-[rgba(138,135,128,0.15)] text-[var(--text-muted)]' :
                'bg-[rgba(100,180,140,0.15)] text-[#64b48c]'
              }`}>
                {hack.badge}
              </span>
              
              <h3 className="font-[var(--font-serif)] text-[1.35rem] mb-1">
                {hack.name}
              </h3>
              
              <div className="text-[0.8rem] text-[var(--text-muted)] mb-3">
                {hack.event}
              </div>
              
              <p className="text-[0.88rem] text-[var(--text-muted)] leading-[1.6] mb-5">
                {hack.description}
              </p>
              
              <div className="flex flex-wrap gap-[0.4rem] mb-5">
                {hack.tech.map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="font-[var(--font-mono)] text-[0.65rem] px-2 py-1 bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[3px] text-[var(--text-muted)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              
              {hack.link && <a
                href={hack.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.8rem] text-[var(--accent)] no-underline font-medium inline-flex items-center gap-[0.35rem] whitespace-nowrap transition-[gap] duration-200 hover:gap-[0.6rem]"
              >
                View on GitHub →
              </a>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
