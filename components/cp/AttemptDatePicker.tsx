'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MONTHS,
  addMonths,
  dayKey,
  daysInMonth,
  parseDayKey,
  startOfMonth,
} from '@/lib/cp/dates';

interface AttemptDatePickerProps {
  /** Selected day as a local day key, or null for "any date". */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Attempts logged per local day key — days with none can't be picked. */
  countsByDay: Map<string, number>;
}

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function shortDate(key: string): string {
  const date = parseDayKey(key);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** The month worth opening on: the selected day, else the latest one logged. */
function defaultMonth(value: string | null, countsByDay: Map<string, number>): Date {
  if (value) return startOfMonth(parseDayKey(value));
  const latest = [...countsByDay.keys()]
    .map(parseDayKey)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  return startOfMonth(latest ?? new Date());
}

export default function AttemptDatePicker({
  value,
  onChange,
  countsByDay,
}: AttemptDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => defaultMonth(value, countsByDay));
  const rootRef = useRef<HTMLDivElement>(null);

  // Reopen on whichever month the current selection lives in, not wherever the
  // arrows were left pointing last time.
  function toggle() {
    if (!open) setMonth(defaultMonth(value, countsByDay));
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const leading = month.getDay();
  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from(
      { length: daysInMonth(month) },
      (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)
    ),
  ];

  return (
    <div ref={rootRef} className="relative font-normal normal-case tracking-normal">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={value ? 'Change the day shown' : 'Show one day only'}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded border px-3 py-2 text-[0.8rem] font-[var(--font-mono)] ${
          value
            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]'
            : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)]'
        }`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
          className="shrink-0"
        >
          <rect x="2" y="3.5" width="12" height="11" rx="1.5" />
          <path d="M2 7h12M5.5 1.5v3M10.5 1.5v3" />
        </svg>
        <span>{value ? shortDate(value) : 'Any date'}</span>
        {value && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
            className="shrink-0 px-0.5 leading-none"
            title="Clear the day filter"
          >
            ×
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-[224px] rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, -1))}
              className="px-1.5 text-[0.8rem] text-[var(--text-muted)] hover:text-[var(--accent)]"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="font-[var(--font-mono)] text-[0.7rem] tracking-[0.06em] text-[var(--text)]">
              {MONTHS[month.getMonth()]} {month.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, 1))}
              className="px-1.5 text-[0.8rem] text-[var(--text-muted)] hover:text-[var(--accent)]"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_INITIALS.map((label, i) => (
              <span
                key={i}
                className="text-center font-[var(--font-mono)] text-[0.6rem] text-[var(--text-muted)]"
              >
                {label}
              </span>
            ))}
            {cells.map((date, i) => {
              if (!date) return <span key={i} />;

              const key = dayKey(date);
              const count = countsByDay.get(key) ?? 0;
              const selected = key === value;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={count === 0}
                  onClick={() => {
                    onChange(selected ? null : key);
                    setOpen(false);
                  }}
                  title={
                    count === 0
                      ? 'Nothing logged'
                      : `${count} attempt${count === 1 ? '' : 's'}`
                  }
                  className={`h-6 rounded font-[var(--font-mono)] text-[0.65rem] ${
                    selected
                      ? 'bg-[var(--accent)] text-[var(--bg)]'
                      : count > 0
                        ? 'bg-[var(--accent-glow)] font-semibold text-[var(--accent)] hover:bg-[var(--accent-dim)] hover:text-[var(--bg)]'
                        : 'text-[var(--text-muted)] opacity-40'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between font-[var(--font-mono)] text-[0.6rem] text-[var(--text-muted)]">
            <span>Shaded days have attempts</span>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="text-[var(--accent)] uppercase tracking-[0.06em]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
