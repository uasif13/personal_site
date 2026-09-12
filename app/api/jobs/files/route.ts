import { NextRequest, NextResponse } from 'next/server';
import { createJobFile } from '@/lib/db/jobs';

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const kind = form?.get('kind');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (kind !== 'resume' && kind !== 'cover_letter') {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File is larger than ${MAX_BYTES / 1024 / 1024}MB` },
      { status: 413 }
    );
  }

  const contentType = file.type || 'application/octet-stream';
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: 'Only PDF, Word, or plain-text files are accepted.' },
      { status: 415 }
    );
  }

  const data = Buffer.from(await file.arrayBuffer()).toString('base64');
  const meta = await createJobFile({
    kind,
    filename: file.name,
    contentType,
    sizeBytes: file.size,
    data,
  });

  return NextResponse.json({ file: meta }, { status: 201 });
}
