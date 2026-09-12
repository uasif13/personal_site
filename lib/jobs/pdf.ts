/**
 * Renders a saved job description to a PDF the browser downloads directly.
 * Client-only — jsPDF is imported lazily so it never enters the server bundle.
 */

const MARGIN = 56;
const LINE_HEIGHT = 15;
const BODY_SIZE = 10.5;

function sanitizeFilename(value: string): string {
  return (
    value
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 60) || 'job-description'
  );
}

export async function exportDescriptionToPdf(job: {
  positionName: string;
  company: string;
  positionLink?: string | null;
  dateApplied?: string | null;
  description: string;
}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  /** Advances the cursor, starting a new page when the current one runs out. */
  const advance = (amount: number) => {
    if (y + amount > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    y += amount;
  };

  const write = (text: string, size: number, style: 'normal' | 'bold', gap = LINE_HEIGHT) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    for (const line of doc.splitTextToSize(text, maxWidth)) {
      advance(gap);
      doc.text(line, MARGIN, y);
    }
  };

  write(job.positionName || 'Untitled position', 18, 'bold', 22);
  if (job.company) write(job.company, 12, 'normal', 18);

  const meta = [
    job.dateApplied ? `Applied ${job.dateApplied}` : null,
    `Saved ${new Date().toISOString().slice(0, 10)}`,
  ]
    .filter(Boolean)
    .join('  ·  ');

  doc.setTextColor(110);
  write(meta, 9, 'normal', 14);
  if (job.positionLink) write(job.positionLink, 9, 'normal', 12);
  doc.setTextColor(0);

  advance(10);
  doc.setDrawColor(210);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  advance(6);

  // Blank lines in the pasted text are meaningful paragraph breaks; keep them.
  for (const paragraph of job.description.split(/\n/)) {
    if (paragraph.trim() === '') {
      advance(8);
      continue;
    }
    write(paragraph, BODY_SIZE, 'normal');
  }

  const name = [job.company, job.positionName].filter(Boolean).join('-');
  doc.save(`${sanitizeFilename(name)}-job-description.pdf`);
}
