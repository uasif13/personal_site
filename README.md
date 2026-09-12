# Personal Website

A modern, minimalist personal portfolio built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Markdown-based blog** — Simply add `.md` files to the `posts/` folder to create new blog posts
- **Responsive design** — Works seamlessly on all devices
- **Fast and optimized** — Built with Next.js 15 for optimal performance
- **TypeScript** — Fully typed for better developer experience

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

```bash
npm run build
npm start
```

## Adding Blog Posts

To add a new blog post:

1. Create a new `.md` file in the `posts/` folder
2. Add frontmatter at the top of the file:

```markdown
---
title: "Your Post Title"
date: "2026-05-02"
tags: ["Tag1", "Tag2"]
excerpt: "A brief summary of your post"
---

# Your Post Title

Your content here...
```

3. Save the file — it will automatically appear on the blog page at `/blog`!

## Project Structure

```
├── app/              # Next.js app directory
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components
│   ├── Nav.tsx
│   ├── Hero.tsx
│   ├── Experience.tsx
│   ├── Hackathons.tsx
│   ├── Blog.tsx
│   ├── Contact.tsx
│   └── Footer.tsx
├── lib/              # Utility functions
│   └── blog.ts       # Blog post utilities
├── posts/            # Markdown blog posts
│   └── *.md
└── public/           # Static assets
    └── resume_4_26.pdf
```

## CP Tracker

`/cp` is a LeetCode/competitive-programming tracker: a table of problems where each
attempt is logged with how it was solved (no help / hints / read the solution), time
taken, and a link to your code. Problems only enter the table once you've actually
attempted them — there's no pre-populated problem bank — logging an attempt can
optionally draft a blog post from your strategy notes.

It also recommends what to do next: an SM-2 spaced-repetition schedule resurfaces
problems you solved cleanly for review once they're due, and a "Try next" panel
suggests unattempted problems from the NeetCode 250 (weighted toward topics you've
covered least) and from the full Codeforces problemset (in a rating band just above
your best clean solve, weighted toward untouched tags) — see `lib/cp/recommend.ts`
and `lib/spaced-repetition.ts`.

Setup:

1. Copy `.env.local.example` to `.env.local` and fill in `DATABASE_URL` (a Neon
   Postgres connection string — add it via Vercel's Storage tab, or create a free
   project at neon.tech), `CP_ADMIN_PASSWORD`, and `SESSION_SECRET` (`openssl rand
   -hex 32`).
2. `npm run db:push` — creates the tables from `lib/db/schema.ts`.
3. Log in at `/cp/login` with `CP_ADMIN_PASSWORD`, then log problems as you solve
   them at `/cp/admin/log` (or via a "Log this" link from a recommendation).

Set the same three env vars in your Vercel project settings for production.

`lib/cp/data/neetcode250.json` and `lib/cp/data/codeforces.json` back the
recommendation engine (the latter pulled from the official Codeforces
`problemset.problems` API). `npm run db:seed` still exists but isn't part of normal
setup — it's unused by the live tracker.

## Job Tracker

`/jobs` is a private application tracker — unlike `/cp`, which is public to read,
every route under `/jobs` and `/api/jobs` requires the session cookie, and the page
is marked `noindex`. It's guarded by the same `CP_ADMIN_PASSWORD` login at
`/cp/login`, so one password unlocks both trackers.

Each row holds the date applied, status (to apply / applied / interviewing /
rejected / accepted), position name and link, the pasted job description, years of
experience, skills, the resume and optional cover letter used, and free-form notes.
Status can be changed straight from the table, which stamps the applied date the
first time a row leaves "To apply".

Two features read the posting for you, both backed by the Anthropic API:

- **Curate the findings** (`lib/jobs/analyze.ts`) pulls the top skills and
  technologies out of the description, separating hard requirements from
  preferences, and lists the literal phrases an ATS is likely to match on. Running
  it also auto-fills the years-of-experience and skills fields, which stay
  ordinary editable inputs afterwards.
- **Rate my resume** (`lib/jobs/score.ts`) grades the attached resume against that
  specific posting: an 0-100 ATS estimate, matched and missing keywords, concrete
  rewrites of existing bullets, and parsing problems to fix before submitting. A
  PDF resume is passed to the model natively so layout is judged too. The prompt
  forbids inventing experience — rewrites are traceable to what's already on the
  resume, and a missing metric comes back as `[X]` for you to fill in.

Both results are cached on the application row, so reopening a row never re-bills
the API; use "Re-analyze" / "Re-score" to refresh. Without `ANTHROPIC_API_KEY` the
rest of the tracker works normally and only these two buttons return an error.

The pasted description collapses out of the way once saved and can be exported to
a PDF ("Save as PDF") so the listing survives being taken down.

Resumes and cover letters are stored base64-encoded in Postgres rather than object
storage, so they inherit the database's privacy and are only reachable through the
login-gated `/api/jobs/files/[id]` route. Deleting an application deletes its
attachments too. Uploads are capped at 4MB and limited to PDF, Word, and text.

Setup is the CP tracker's setup plus `ANTHROPIC_API_KEY` in `.env.local` (and in
your Vercel project settings), then `npm run db:push` to create the
`job_applications` and `job_files` tables.

## Customization

- **Colors**: Edit CSS variables in `app/globals.css`
- **Content**: Update component files in `components/`
- **Fonts**: Modify font imports in `app/globals.css`

## Technologies

- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [gray-matter](https://github.com/jonschlinkert/gray-matter) — Markdown frontmatter parsing

## License

© 2026 Asif Uddin. All rights reserved.
