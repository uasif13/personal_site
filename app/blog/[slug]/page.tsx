import Nav from '@/components/Nav';
import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} — Asif Uddin`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-24 px-6 sm:px-12">
        <article className="max-w-[800px] mx-auto">
          {post.tags.length > 0 && (
            <div className="flex gap-2 mb-4">
              {post.tags.map((tag, tagIndex) => (
                <span key={tagIndex}>
                  <span className="font-[var(--font-mono)] text-[0.65rem] text-[var(--accent-dim)] tracking-[0.08em] uppercase">
                    {tag}
                  </span>
                  {tagIndex < post.tags.length - 1 && (
                    <span className="font-[var(--font-mono)] text-[0.65rem] text-[var(--accent-dim)] tracking-[0.08em] uppercase"> · </span>
                  )}
                </span>
              ))}
            </div>
          )}
          
          <h1 className="font-[var(--font-serif)] text-[clamp(2.5rem,6vw,4rem)] leading-[1.1] tracking-tight font-normal mb-4">
            {post.title}
          </h1>
          
          <div className="font-[var(--font-mono)] text-[0.8rem] text-[var(--text-muted)] mb-12 pb-8 border-b border-[var(--border)]">
            {formatDate(post.date)}
          </div>
          
          <div 
            className="prose prose-invert prose-lg max-w-none
              prose-headings:font-[var(--font-serif)] prose-headings:tracking-tight prose-headings:font-normal
              prose-h1:text-[2.5rem] prose-h1:mb-6 prose-h1:mt-12
              prose-h2:text-[2rem] prose-h2:mb-4 prose-h2:mt-10
              prose-h3:text-[1.5rem] prose-h3:mb-3 prose-h3:mt-8
              prose-p:text-[var(--text-muted)] prose-p:leading-[1.8] prose-p:mb-6
              prose-a:text-[var(--accent)] prose-a:no-underline prose-a:border-b prose-a:border-[var(--accent-dim)] hover:prose-a:border-[var(--accent)]
              prose-strong:text-[var(--text)] prose-strong:font-semibold
              prose-code:font-[var(--font-mono)] prose-code:text-[0.85em] prose-code:bg-[var(--bg-card)] prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-[var(--accent)] prose-code:before:content-[''] prose-code:after:content-['']
              prose-pre:bg-[var(--bg-card)] prose-pre:border prose-pre:border-[var(--border)] prose-pre:rounded-lg
              prose-ul:text-[var(--text-muted)] prose-ul:list-disc prose-ul:pl-6
              prose-ol:text-[var(--text-muted)] prose-ol:list-decimal prose-ol:pl-6
              prose-li:mb-2
              prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent-dim)] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-[var(--text-muted)]"
            dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(post.content) }}
          />
          
          <div className="mt-16 pt-8 border-t border-[var(--border)]">
            <a 
              href="/blog" 
              className="text-[var(--accent)] no-underline text-[0.9rem] font-medium inline-flex items-center gap-2 transition-colors hover:text-[var(--text)]"
            >
              ← Back to all posts
            </a>
          </div>
        </article>
      </main>
    </>
  );
}

function convertMarkdownToHTML(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
  
  // Paragraphs (split by double newlines)
  const paragraphs = html.split('\n\n');
  html = paragraphs
    .map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<ol')) {
        return p;
      }
      return `<p>${p}</p>`;
    })
    .join('\n');
  
  // Single line breaks
  html = html.replace(/\n/g, '<br />');
  
  return html;
}
