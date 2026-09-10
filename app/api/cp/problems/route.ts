import { NextResponse } from 'next/server';
import { getAllProblemsWithAttempts } from '@/lib/db/queries';

// No POST here on purpose — problems only enter the tracker via /api/cp/log,
// bundled together with their first attempt, never pre-added on their own.
export async function GET() {
  const problems = await getAllProblemsWithAttempts();
  return NextResponse.json({ problems });
}
