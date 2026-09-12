'use client';

import { useRef, useState } from 'react';
import type { FileMeta } from '@/lib/db/jobs';

interface FileFieldProps {
  label: string;
  kind: 'resume' | 'cover_letter';
  value: FileMeta | null;
  onChange: (file: FileMeta | null) => void;
  hint?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FileField({ label, kind, value, onChange, hint }: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    const body = new FormData();
    body.append('file', file);
    body.append('kind', kind);

    const res = await fetch('/api/jobs/files', { method: 'POST', body });
    const payload = await res.json().catch(() => null);
    setUploading(false);

    if (!res.ok) {
      setError(payload?.error ?? 'Upload failed.');
      return;
    }
    onChange(payload.file as FileMeta);
  }

  return (
    <div className="flex flex-col gap-1 text-[0.75rem] text-[var(--text-muted)]">
      <span>{label}</span>

      {value ? (
        <div className="flex items-center gap-3 bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2">
          <a
            href={`/api/jobs/files/${value.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.8rem] text-[var(--accent)] truncate flex-1 border-b border-transparent hover:border-[var(--accent)]"
          >
            {value.filename}
          </a>
          <span className="text-[0.7rem] shrink-0">{formatSize(value.sizeBytes)}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[0.7rem] shrink-0 hover:text-[var(--text)]"
            aria-label={`Remove ${value.filename}`}
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="bg-[var(--bg)] border border-dashed border-[var(--border)] rounded px-3 py-2 text-[0.8rem] text-left text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : `Attach a file — PDF, Word, or text`}
          </button>
        </>
      )}

      {hint && !error && <span className="text-[0.68rem] opacity-70">{hint}</span>}
      {error && <span className="text-[0.7rem] text-red-400">{error}</span>}
    </div>
  );
}
