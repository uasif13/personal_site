import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.8s ease',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
