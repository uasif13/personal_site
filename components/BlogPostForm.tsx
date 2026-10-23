'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FIELD_CLASS =
  'bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text)] text-[0.85rem]';
const LABEL_CLASS = 'flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]';

export default function BlogPostForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tags, setTags] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/blog/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        date,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        excerpt,
        content,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError('Could not publish the post. Are you still logged in?');
      return;
    }

    // The slug is assigned server-side (deduped), so read it back for the redirect.
    const { post } = await res.json();
    router.push(`/blog/${post.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={LABEL_CLASS}>
        Title
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What this post is about"
          className={FIELD_CLASS}
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className={LABEL_CLASS}>
          Date
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <label className={LABEL_CLASS}>
          Tags (comma-separated)
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Systems, Postgres"
            className={FIELD_CLASS}
          />
        </label>
      </div>

      <label className={LABEL_CLASS}>
        Excerpt (optional — defaults to the opening lines)
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="One or two sentences for the blog index."
          className={FIELD_CLASS}
        />
      </label>

      <label className={LABEL_CLASS}>
        Post (markdown)
        <textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={18}
          placeholder={'## A heading\n\nSome **bold** text, a [link](https://example.com), and `code`.'}
          className={`${FIELD_CLASS} font-[var(--font-mono)] leading-[1.7]`}
        />
      </label>

      {error && <div className="text-[0.8rem] text-red-400">{error}</div>}

      <div className="flex gap-3 mt-1">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[var(--accent)] text-[var(--bg)] px-5 py-2.5 rounded font-semibold text-[0.8rem] tracking-[0.06em] transition-all hover:opacity-85 disabled:opacity-50"
        >
          {submitting ? 'Publishing…' : 'Publish post'}
        </button>
        <a
          href="/blog"
          className="text-[var(--text-muted)] px-4 py-2.5 rounded font-medium text-[0.8rem] hover:text-[var(--text)] no-underline"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
