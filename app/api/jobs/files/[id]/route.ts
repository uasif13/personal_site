import { NextRequest, NextResponse } from 'next/server';
import { getJobFile } from '@/lib/db/jobs';

/**
 * Serves an attached resume or cover letter. Reachable only behind the session
 * cookie (see middleware.ts) — these files are never public, so they're also
 * marked no-store so a shared machine's browser cache doesn't keep them.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const file = await getJobFile(id);
  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const bytes = Buffer.from(file.data, 'base64');
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': file.contentType,
      'Content-Length': String(bytes.length),
      'Content-Disposition': `inline; filename="${file.filename.replace(/"/g, '')}"`,
      'Cache-Control': 'no-store, private',
    },
  });
}
