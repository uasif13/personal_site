export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-12 py-8 flex justify-between items-center flex-wrap gap-4">
      <span className="text-[0.8rem] text-[var(--text-muted)]">
        © 2026 Asif Uddin. All rights reserved.
      </span>
      <span className="font-[var(--font-mono)] text-[0.7rem] text-[var(--text-muted)]">
        Built with care.
      </span>
    </footer>
  );
}
