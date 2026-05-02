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
