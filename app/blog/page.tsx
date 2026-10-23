import { cookies } from 'next/headers';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Blog from '@/components/Blog';
import { getAllPosts } from '@/lib/blog';
import { CP_SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export const metadata = {
  title: 'Blog — Asif Uddin',
  description: 'Writing and thinking about software engineering, distributed systems, and AI.',
};

// New CP-tracker blog posts live in the DB and should show up without a redeploy.
export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const cookieStore = await cookies();
  const [posts, isAuthed] = await Promise.all([
    getAllPosts(),
    verifySessionToken(cookieStore.get(CP_SESSION_COOKIE)?.value),
  ]);

  return (
    <>
      <Nav />
      <div className="min-h-screen pt-24">
        {isAuthed && (
          <div className="px-6 sm:px-12 pt-12">
            {/* Same padding + 800px column as <Blog>, so the button lines up
                with the right edge of the post list rather than the viewport. */}
            <div className="max-w-[800px] flex justify-end">
              <Link
                href="/blog/admin/new"
                className="bg-[var(--accent)] text-[var(--bg)] px-5 py-2.5 rounded font-semibold text-[0.8rem] tracking-[0.06em] transition-all hover:opacity-85 no-underline"
              >
                + New post
              </Link>
            </div>
          </div>
        )}
        <Blog posts={posts} />
      </div>
    </>
  );
}
