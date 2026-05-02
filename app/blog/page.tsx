import Nav from '@/components/Nav';
import Blog from '@/components/Blog';
import { getAllPosts } from '@/lib/blog';

export const metadata = {
  title: 'Blog — Asif Uddin',
  description: 'Writing and thinking about software engineering, distributed systems, and AI.',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <Nav />
      <div className="min-h-screen pt-24">
        <Blog posts={posts} />
      </div>
    </>
  );
}
