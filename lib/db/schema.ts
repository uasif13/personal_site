import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const problems = pgTable('problems', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull().unique(),
  source: varchar('source', { length: 32 }).notNull(), // 'neetcode250' | 'youkn0wwho' | 'custom'
  platform: varchar('platform', { length: 32 }).notNull(), // 'leetcode' | 'codeforces' | 'atcoder' | 'other'
  difficulty: varchar('difficulty', { length: 32 }).notNull(),
  topics: text('topics').array().notNull().default([]),
  pattern: text('pattern'), // NeetCode roadmap category, nullable
  cfRating: integer('cf_rating'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: text('title').notNull(),
  date: varchar('date', { length: 32 }).notNull(),
  tags: text('tags').array().notNull().default([]),
  excerpt: text('excerpt').notNull().default(''),
  content: text('content').notNull(),
  problemId: integer('problem_id').references(() => problems.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const attempts = pgTable('attempts', {
  id: serial('id').primaryKey(),
  problemId: integer('problem_id')
    .notNull()
    .references(() => problems.id),
  status: varchar('status', { length: 32 }).notNull(), // 'solved_no_help' | 'solved_with_hints' | 'solved_with_solution' | 'attempted_unsolved'
  durationMinutes: integer('duration_minutes'),
  solutionUrl: text('solution_url'),
  notes: text('notes'),
  blogPostId: integer('blog_post_id').references(() => blogPosts.id),
  solvedAt: timestamp('solved_at').notNull().defaultNow(),
});
