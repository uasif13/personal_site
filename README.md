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

Setup:

1. Copy `.env.local.example` to `.env.local` and fill in `DATABASE_URL` (a Neon
   Postgres connection string — add it via Vercel's Storage tab, or create a free
   project at neon.tech), `CP_ADMIN_PASSWORD`, and `SESSION_SECRET` (`openssl rand
   -hex 32`).
2. `npm run db:push` — creates the tables from `lib/db/schema.ts`.
3. Log in at `/cp/login` with `CP_ADMIN_PASSWORD`, then log problems as you solve
   them at `/cp/admin/log`.

Set the same three env vars in your Vercel project settings for production.

`scripts/data/neetcode250.json` (the full NeetCode 250 list) and `npm run db:seed`
still exist but aren't part of normal setup — they're there for a future
recommendation feature, not for pre-populating the tracker.

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
