'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface ActivityEntry {
  at: string; // ISO timestamp of the attempt
  solved: boolean;
}

interface ActivityCalendarProps {
  activity: ActivityEntry[];
}

interface DayStats {
  attempts: number;
  solved: number;
}

const PAST_YEAR = 'past';
const CELL = 11;
const GAP = 3;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

// Keyed and iterated in the viewer's local timezone, so a late-night solve lands
// on the day it actually happened for them. Stepping with the Date constructor
// (rather than adding 86400000ms) keeps DST transitions from skipping days.
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function level(attempts: number): number {
  if (attempts === 0) return 0;
  if (attempts === 1) return 1;
  if (attempts === 2) return 2;
  if (attempts <= 4) return 3;
  return 4;
}

const LEVEL_COLORS = [
  'var(--border)',
  'color-mix(in srgb, var(--accent) 30%, var(--bg-card))',
  'color-mix(in srgb, var(--accent) 55%, var(--bg-card))',
  'color-mix(in srgb, var(--accent) 80%, var(--bg-card))',
  'var(--accent)',
];

function computeStreaks(byDay: Map<string, DayStats>, today: Date) {
  const keys = [...byDay.keys()]
    .map((k) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m - 1, d);
    })
    .sort((a, b) => a.getTime() - b.getTime());

  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const day of keys) {
    run = prev && dayKey(addDays(prev, 1)) === dayKey(day) ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }

  // A streak is still alive if today hasn't been logged yet but yesterday was.
  let cursor = byDay.has(dayKey(today)) ? today : addDays(today, -1);
  let current = 0;
  while (byDay.has(dayKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ActivityCalendar({ activity }: ActivityCalendarProps) {
  // Rendering depends on the viewer's clock and timezone, which the server
  // doesn't know — wait for mount to avoid a hydration mismatch.
  const [today, setToday] = useState<Date | null>(null);
  const [range, setRange] = useState<string>(PAST_YEAR);
  const [hover, setHover] = useState<{ date: Date; x: number; y: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToday(startOfDay(new Date()));
  }, []);

  // On narrow screens the grid scrolls; start at the most recent weeks.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [today, range]);

  const byDay = useMemo(() => {
    const map = new Map<string, DayStats>();
    for (const entry of activity) {
      const key = dayKey(new Date(entry.at));
      const stats = map.get(key) ?? { attempts: 0, solved: 0 };
      stats.attempts += 1;
      if (entry.solved) stats.solved += 1;
      map.set(key, stats);
    }
    return map;
  }, [activity]);

  const years = useMemo(() => {
    const set = new Set(activity.map((e) => new Date(e.at).getFullYear()));
    if (today) set.add(today.getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [activity, today]);

  if (!today) {
    return <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 h-[220px]" />;
  }

  const rangeStart =
    range === PAST_YEAR ? addDays(today, -364) : new Date(Number(range), 0, 1);
  const rangeEnd = range === PAST_YEAR ? today : new Date(Number(range), 11, 31);
  const gridStart = addDays(rangeStart, -rangeStart.getDay()); // back up to Sunday

  const weeks: (Date | null)[][] = [];
  for (let cursor = gridStart; cursor <= rangeEnd; cursor = addDays(cursor, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(cursor, i);
        return date < rangeStart || date > rangeEnd ? null : date;
      })
    );
  }

  // Label a column with the month whose 1st falls in it. The first column gets
  // its partial month's label too, unless too little of that month is shown.
  const monthLabels = weeks.map((week, i) => {
    if (i === 0) {
      const first = week.find((d) => d !== null);
      return first && first.getDate() <= 14 ? MONTHS[first.getMonth()] : '';
    }
    const firstOfMonth = week.find((d) => d?.getDate() === 1);
    return firstOfMonth ? MONTHS[firstOfMonth.getMonth()] : '';
  });

  let rangeAttempts = 0;
  let rangeActiveDays = 0;
  for (let d = rangeStart; d <= rangeEnd; d = addDays(d, 1)) {
    const stats = byDay.get(dayKey(d));
    if (stats) {
      rangeAttempts += stats.attempts;
      rangeActiveDays += 1;
    }
  }

  const { current, longest } = computeStreaks(byDay, today);
  const hovered = hover ? byDay.get(dayKey(hover.date)) : undefined;

  function handleEnter(e: React.MouseEvent<HTMLDivElement>, date: Date) {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const cell = e.currentTarget.getBoundingClientRect();
    const box = wrapper.getBoundingClientRect();
    setHover({ date, x: cell.left - box.left + cell.width / 2, y: cell.top - box.top });
  }

  return (
    <div
      ref={wrapperRef}
      className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6"
    >
      <div className="flex flex-wrap justify-between items-baseline gap-x-6 gap-y-3 mb-5">
        <div className="text-[0.85rem] text-[var(--text-muted)]">
          <span className="font-[var(--font-serif)] text-[1.4rem] text-[var(--text)]">
            {rangeAttempts}
          </span>{' '}
          {rangeAttempts === 1 ? 'attempt' : 'attempts'}{' '}
          {range === PAST_YEAR ? 'in the past year' : `in ${range}`}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-[var(--font-mono)] text-[0.7rem] text-[var(--text-muted)] tracking-[0.05em]">
          <span>
            Active days: <span className="text-[var(--text)]">{rangeActiveDays}</span>
          </span>
          <span>
            Current streak: <span className="text-[var(--accent)]">{current}</span>
          </span>
          <span>
            Longest streak: <span className="text-[var(--text)]">{longest}</span>
          </span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-[0.7rem] text-[var(--text)]"
          >
            <option value={PAST_YEAR}>Past year</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Outside the scroll area so the weekday labels stay put on narrow screens. */}
        <div
          className="grid shrink-0 font-[var(--font-mono)] text-[0.6rem] text-[var(--text-muted)]"
          style={{ gridTemplateRows: `${CELL + 4}px repeat(7, ${CELL}px)`, rowGap: GAP }}
        >
          <span />
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="leading-[11px]">
              {label}
            </span>
          ))}
        </div>
        <div ref={scrollRef} className="overflow-x-auto pb-1 min-w-0">
          <div
            className="grid grid-flow-col"
            style={{
              gridTemplateRows: `${CELL + 4}px repeat(7, ${CELL}px)`,
              gridAutoColumns: `${CELL}px`,
              gap: GAP,
            }}
          >
            {weeks.map((week, wi) => (
              <div key={wi} className="contents">
                <span className="font-[var(--font-mono)] text-[0.6rem] text-[var(--text-muted)] whitespace-nowrap leading-[11px] overflow-visible">
                  {monthLabels[wi]}
                </span>
                {week.map((date, di) =>
                  date ? (
                    <div
                      key={di}
                      onMouseEnter={(e) => handleEnter(e, date)}
                      onMouseLeave={() => setHover(null)}
                      aria-label={`${formatDate(date)}: ${byDay.get(dayKey(date))?.attempts ?? 0} attempts`}
                      className="rounded-[2px]"
                      style={{
                        width: CELL,
                        height: CELL,
                        background: LEVEL_COLORS[level(byDay.get(dayKey(date))?.attempts ?? 0)],
                      }}
                    />
                  ) : (
                    <div key={di} />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-1 mt-3 font-[var(--font-mono)] text-[0.6rem] text-[var(--text-muted)]">
        <span className="mr-1">Less</span>
        {LEVEL_COLORS.map((color, i) => (
          <span
            key={i}
            className="rounded-[2px]"
            style={{ width: CELL, height: CELL, background: color }}
          />
        ))}
        <span className="ml-1">More</span>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-[var(--text)] px-2.5 py-1.5 text-[0.7rem] text-[var(--bg)] shadow"
          style={{ left: hover.x, top: hover.y - 6 }}
        >
          <span className="font-semibold">
            {hovered
              ? `${hovered.attempts} ${hovered.attempts === 1 ? 'attempt' : 'attempts'}${
                  hovered.solved ? ` · ${hovered.solved} solved` : ''
                }`
              : 'No activity'}
          </span>{' '}
          on {formatDate(hover.date)}
        </div>
      )}
    </div>
  );
}
