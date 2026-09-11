/**
 * SM-2 spaced repetition, adapted so the "quality" rating (normally entered by
 * hand after a flashcard review) is instead inferred from how an attempt went:
 * solved cleanly and fast → high quality → longer interval before review.
 * Needed a solution or hints, or didn't solve it → low quality → review soon.
 */

export type AttemptStatus =
  | 'solved_no_help'
  | 'solved_with_hints'
  | 'solved_with_solution'
  | 'attempted_unsolved';

export function qualityFromAttempt(
  status: AttemptStatus,
  durationMinutes: number | null | undefined
): number {
  if (status === 'attempted_unsolved') return 0;
  if (status === 'solved_with_solution') return 1;
  if (status === 'solved_with_hints') return 2;
  // solved_no_help — reward faster clean solves with a longer runway.
  if (durationMinutes == null) return 4;
  if (durationMinutes <= 20) return 5;
  if (durationMinutes <= 45) return 4;
  return 3;
}

export interface ReviewState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export const INITIAL_REVIEW_STATE: ReviewState = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
};

/** Given the previous SM-2 state and a 0-5 quality score, returns the next state. */
export function nextReviewState(previous: ReviewState, quality: number): ReviewState {
  if (quality < 3) {
    return { easeFactor: previous.easeFactor, intervalDays: 1, repetitions: 0 };
  }

  const repetitions = previous.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) {
    intervalDays = 1;
  } else if (repetitions === 2) {
    intervalDays = 6;
  } else {
    intervalDays = Math.round(previous.intervalDays * previous.easeFactor);
  }

  const easeFactor = Math.max(
    1.3,
    previous.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return { easeFactor, intervalDays, repetitions };
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
