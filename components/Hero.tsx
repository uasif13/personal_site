'use client';

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 sm:px-12 pt-32 pb-16 relative overflow-hidden">
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-[radial-gradient(circle,var(--accent-glow)_0%,transparent_70%)] pointer-events-none"></div>
      
      <div className="opacity-0 animate-fadeUp [animation-delay:0.2s] [animation-fill-mode:forwards] font-[var(--font-mono)] text-[0.8rem] text-[var(--accent)] tracking-[0.2em] uppercase mb-6">
        Software Engineer · NYC, NY
      </div>
      
      <h1 className="opacity-0 animate-fadeUp [animation-delay:0.4s] [animation-fill-mode:forwards] font-[var(--font-serif)] text-[clamp(3rem,8vw,6.5rem)] leading-[1.05] tracking-tight font-normal max-w-[900px]">
        Asif Uddin<br />builds <em className="italic text-[var(--accent)]">systems</em> that scale.
      </h1>
      
      <p className="opacity-0 animate-fadeUp [animation-delay:0.6s] [animation-fill-mode:forwards] text-[1.15rem] text-[var(--text-muted)] max-w-[560px] mt-8 leading-[1.7]">
        MS Computer Science @ NJIT. Former software engineer at Bloomberg LP.
        Building at the intersection of distributed systems, full-stack development, and AI.
      </p>
      
      <div className="opacity-0 animate-fadeUp [animation-delay:0.8s] [animation-fill-mode:forwards] flex flex-wrap gap-4 sm:gap-6 mt-10">
        <a href="https://github.com/uasif13" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium inline-flex items-center gap-[0.4rem] whitespace-nowrap transition-colors border-b border-[var(--border)] pb-[2px] hover:text-[var(--accent)] hover:border-[var(--accent)]">
          GitHub ↗
        </a>
        <a href="https://www.linkedin.com/in/asifu" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium inline-flex items-center gap-[0.4rem] whitespace-nowrap transition-colors border-b border-[var(--border)] pb-[2px] hover:text-[var(--accent)] hover:border-[var(--accent)]">
          LinkedIn ↗
        </a>
        <a href="mailto:uasif13@gmail.com" className="text-[var(--text-muted)] no-underline text-[0.85rem] font-medium inline-flex items-center gap-[0.4rem] whitespace-nowrap transition-colors border-b border-[var(--border)] pb-[2px] hover:text-[var(--accent)] hover:border-[var(--accent)]">
          uasif13@gmail.com
        </a>
      </div>
    </section>
  );
}
