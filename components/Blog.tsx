'use client';

import { useEffect, useRef } from 'react';
import type { BlogPost } from '@/lib/blog';

interface BlogProps {
  posts: BlogPost[];
}

export default function Blog({ posts }: BlogProps) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return { month, day, year };
  };

  return (
    <>
      <section id="blog" ref={sectionRef} className="fade-section px-12 py-24">
        <div className="font-[var(--font-mono)] text-[0.7rem] text-[var(--accent)] tracking-[0.25em] uppercase mb-3">
          Blog
        </div>
        <h2 className="font-[var(--font-serif)] text-[clamp(2rem,4vw,3.5rem)] tracking-tight font-normal mb-12">
          Writing &amp; thinking
        </h2>

        <div className="max-w-[800px]">
          {posts.map((post, index) => {
            const { month, day, year } = formatDate(post.date);
            const isFirst = index === 0;
            const isLast = index === posts.length - 1;

            return (
              <div
                key={post.slug}
                className={`border-b border-[var(--border)] py-8 grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-2 sm:gap-8 items-start transition-all ${
                  isFirst ? 'pt-0' : ''
                } ${isLast ? 'border-b-0' : ''}`}
              >
                <div className="font-[var(--font-mono)] text-[0.75rem] text-[var(--text-muted)] pt-[0.35rem]">
                  {month} {day}<br />{year}
                </div>
                
                <div>
                  {post.tags.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      {post.tags.map((tag, tagIndex) => (
                        <span key={tagIndex}>
                          <span className="font-[var(--font-mono)] text-[0.6rem] text-[var(--accent-dim)] tracking-[0.08em] uppercase">
                            {tag}
                          </span>
                          {tagIndex < post.tags.length - 1 && (
                            <span className="font-[var(--font-mono)] text-[0.6rem] text-[var(--accent-dim)] tracking-[0.08em] uppercase"> · </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <a href={`/blog/${post.slug}`} className="no-underline">
                    <h3 className="font-[var(--font-serif)] text-[1.35rem] tracking-tight font-normal mb-2 cursor-pointer transition-colors hover:text-[var(--accent)]">
                      {post.title}
                    </h3>
                  </a>
                  
                  <p className="text-[0.88rem] text-[var(--text-muted)] leading-[1.65]">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </section>
    </>
  );
}
