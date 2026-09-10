import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getAllDbBlogPosts, getDbBlogPostBySlug } from './db/queries';

const postsDirectory = path.join(process.cwd(), 'posts');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string;
}

function getFileSystemPosts(): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || '',
        date: data.date || '',
        tags: data.tags || [],
        excerpt: data.excerpt || '',
        content,
      };
    });
}

function getFileSystemPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || '',
      date: data.date || '',
      tags: data.tags || [],
      excerpt: data.excerpt || '',
      content,
    };
  } catch {
    return null;
  }
}

async function getDbPosts(): Promise<BlogPost[]> {
  try {
    const dbPosts = await getAllDbBlogPosts();
    return dbPosts.map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      tags: post.tags,
      excerpt: post.excerpt,
      content: post.content,
    }));
  } catch {
    // CP tracker DB isn't configured yet — fall back to filesystem-only posts.
    return [];
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const [fsPosts, dbPosts] = await Promise.all([
    Promise.resolve(getFileSystemPosts()),
    getDbPosts(),
  ]);

  return [...fsPosts, ...dbPosts].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const fsPost = getFileSystemPostBySlug(slug);
  if (fsPost) return fsPost;

  try {
    const dbPost = await getDbBlogPostBySlug(slug);
    if (!dbPost) return null;
    return {
      slug: dbPost.slug,
      title: dbPost.title,
      date: dbPost.date,
      tags: dbPost.tags,
      excerpt: dbPost.excerpt,
      content: dbPost.content,
    };
  } catch {
    return null;
  }
}
