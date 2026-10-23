import Nav from '@/components/Nav';
import BlogPostForm from '@/components/BlogPostForm';

export const metadata = {
  title: 'New Post — Asif Uddin',
};

export default function NewBlogPostPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-24 px-6 sm:px-12">
        <div className="max-w-[800px] mx-auto">
          <h1 className="font-[var(--font-serif)] text-[2.5rem] tracking-tight font-normal mb-2">
            New post
          </h1>
          <p className="text-[0.85rem] text-[var(--text-muted)] mb-8">
            Published straight to the blog — no redeploy. Markdown works for
            headings, bold, links, lists and code.
          </p>
          <BlogPostForm />
        </div>
      </main>
    </>
  );
}
