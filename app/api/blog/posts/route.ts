import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createStandaloneBlogPost } from '@/lib/db/queries';

// Auth comes from middleware.ts, which gates every mutating method under
// /api/blog with the same session the CP and job trackers use.
const createPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  tags: z.array(z.string().trim().min(1)).max(10).default([]),
  excerpt: z.string().trim().max(400).default(''),
  content: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, date, tags, excerpt, content } = parsed.data;
  // An empty excerpt would render as a blank line on /blog, so fall back to the
  // opening of the post itself.
  const post = await createStandaloneBlogPost({
    title,
    date,
    tags,
    excerpt: excerpt || content.slice(0, 180),
    content,
  });

  return NextResponse.json({ post });
}
