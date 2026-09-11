import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const problems = pgTable('problems', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull().unique(),
  source: varchar('source', { length: 32 }).notNull(), // 'neetcode250' | 'codeforces' | 'youkn0wwho' | 'custom'
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

// One row per problem, tracking its SM-2 spaced-repetition state. Created/updated
// whenever a new attempt is logged for that problem.
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  problemId: integer('problem_id')
    .notNull()
    .unique()
    .references(() => problems.id),
  easeFactor: real('ease_factor').notNull().default(2.5),
  intervalDays: integer('interval_days').notNull().default(0),
  repetitions: integer('repetitions').notNull().default(0),
  nextReviewDate: timestamp('next_review_date').notNull().defaultNow(),
  lastReviewedAt: timestamp('last_reviewed_at').notNull().defaultNow(),
});
