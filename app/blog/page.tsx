import Nav from '@/components/Nav';
import Blog from '@/components/Blog';
import { getAllPosts } from '@/lib/blog';

export const metadata = {
  title: 'Blog — Asif Uddin',
  description: 'Writing and thinking about software engineering, distributed systems, and AI.',
};

// New CP-tracker blog posts live in the DB and should show up without a redeploy.
export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <>
      <Nav />
      <div className="min-h-screen pt-24">
        <Blog posts={posts} />
      </div>
    </>
  );
}
