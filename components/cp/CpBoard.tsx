'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { ProblemWithAttempts } from '@/lib/db/queries';
import ActivityCalendar from './ActivityCalendar';
import ProblemTable from './ProblemTable';
import { SOLVED_STATUSES } from './StatsBar';

interface CpBoardProps {
  problems: ProblemWithAttempts[];
  isAuthed: boolean;
  /** Rendered between the heatmap and the table — the recommendation cards. */
  children: ReactNode;
}

/**
 * Holds the one piece of state the heatmap and the problem table share: the day
 * being looked at. Clicking a square up top and picking a date down in the
 * table are the same action.
 */
export default function CpBoard({ problems, isAuthed, children }: CpBoardProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const activity = useMemo(
    () =>
      problems.flatMap((p) =>
        p.attempts.map((a) => ({
          at: new Date(a.solvedAt).toISOString(),
          solved: SOLVED_STATUSES.has(a.status),
        }))
      ),
    [problems]
  );

  // The table sits below the recommendation cards, so a click on the heatmap
  // would otherwise filter something off screen.
  function selectFromCalendar(day: string | null) {
    setSelectedDay(day);
    if (day) tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <div className="mt-4">
        <ActivityCalendar
          activity={activity}
          selectedDay={selectedDay}
          onSelectDay={selectFromCalendar}
        />
      </div>
      <div className="mt-12">
        {children}
        <div ref={tableRef} className="scroll-mt-28">
          <ProblemTable
            problems={problems}
            isAuthed={isAuthed}
            dateFilter={selectedDay}
            onDateFilterChange={setSelectedDay}
          />
        </div>
      </div>
    </>
  );
}
