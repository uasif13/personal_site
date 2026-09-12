import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  varchar,
  jsonb,
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

// Resumes and cover letters attached to job applications. The bytes live here
// rather than in object storage so they inherit the database's privacy — they're
// only ever reachable through the login-gated /api/jobs/files/[id] route. Stored
// base64-encoded in a text column: `bytea` over the neon-http driver round-trips
// as hex strings and needs a custom type, and the 33% size cost is irrelevant
// for the few-hundred-KB PDFs this holds.
export const jobFiles = pgTable('job_files', {
  id: serial('id').primaryKey(),
  kind: varchar('kind', { length: 16 }).notNull(), // 'resume' | 'cover_letter'
  filename: text('filename').notNull(),
  contentType: varchar('content_type', { length: 128 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  data: text('data').notNull(), // base64
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const jobApplications = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  positionName: text('position_name').notNull(),
  company: text('company').notNull().default(''),
  positionLink: text('position_link'),
  status: varchar('status', { length: 32 }).notNull().default('to_apply'), // 'to_apply' | 'applied' | 'interviewing' | 'rejected' | 'accepted'
  dateApplied: varchar('date_applied', { length: 32 }), // YYYY-MM-DD; null while still 'to_apply'
  description: text('description').notNull().default(''),
  // Auto-filled from the description by the analyzer, then freely editable.
  yearsExperience: text('years_experience'),
  skills: text('skills').array().notNull().default([]),
  notes: text('notes'),
  // Analyzer output (see lib/jobs/analyze.ts) and resume-vs-description scoring
  // (see lib/jobs/score.ts), cached so a page load never re-bills the API.
  analysis: jsonb('analysis'),
  resumeScore: jsonb('resume_score'),
  resumeFileId: integer('resume_file_id').references(() => jobFiles.id),
  coverLetterFileId: integer('cover_letter_file_id').references(() => jobFiles.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
