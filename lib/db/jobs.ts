import { desc, eq, inArray } from 'drizzle-orm';
import { db } from './index';
import { jobApplications, jobFiles } from './schema';
import type { JobAnalysis, ResumeScore } from '../jobs/types';

export type JobFile = typeof jobFiles.$inferSelect;
type JobApplicationRow = typeof jobApplications.$inferSelect;

/** An application with its file metadata joined in — never the file bytes. */
export interface JobApplication extends Omit<JobApplicationRow, 'analysis' | 'resumeScore'> {
  analysis: JobAnalysis | null;
  resumeScore: ResumeScore | null;
  resumeFile: FileMeta | null;
  coverLetterFile: FileMeta | null;
}

export interface FileMeta {
  id: number;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface JobApplicationInput {
  positionName: string;
  company: string;
  positionLink?: string | null;
  status: string;
  dateApplied?: string | null;
  description: string;
  yearsExperience?: string | null;
  skills: string[];
  notes?: string | null;
  resumeFileId?: number | null;
  coverLetterFileId?: number | null;
}

function toApplication(
  row: JobApplicationRow,
  filesById: Map<number, FileMeta>
): JobApplication {
  const { analysis, resumeScore, ...rest } = row;
  return {
    ...rest,
    analysis: (analysis as JobAnalysis | null) ?? null,
    resumeScore: (resumeScore as ResumeScore | null) ?? null,
    resumeFile: row.resumeFileId ? filesById.get(row.resumeFileId) ?? null : null,
    coverLetterFile: row.coverLetterFileId
      ? filesById.get(row.coverLetterFileId) ?? null
      : null,
  };
}

/**
 * Loads every application. Deliberately selects file metadata without the `data`
 * column so a page render never pulls megabytes of base64 out of the database.
 */
export async function getAllApplications(): Promise<JobApplication[]> {
  const [rows, files] = await Promise.all([
    db.select().from(jobApplications).orderBy(desc(jobApplications.createdAt)),
    db
      .select({
        id: jobFiles.id,
        filename: jobFiles.filename,
        contentType: jobFiles.contentType,
        sizeBytes: jobFiles.sizeBytes,
      })
      .from(jobFiles),
  ]);

  const filesById = new Map(files.map((f) => [f.id, f]));
  return rows.map((row) => toApplication(row, filesById));
}

export async function getApplicationById(id: number): Promise<JobApplicationRow | null> {
  const rows = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createApplication(
  input: JobApplicationInput
): Promise<JobApplicationRow> {
  const [row] = await db.insert(jobApplications).values(input).returning();
  return row;
}

export async function updateApplication(
  id: number,
  patch: Partial<JobApplicationInput> & {
    analysis?: JobAnalysis | null;
    resumeScore?: ResumeScore | null;
  }
): Promise<JobApplicationRow | null> {
  const [row] = await db
    .update(jobApplications)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(jobApplications.id, id))
    .returning();
  return row ?? null;
}

/**
 * Deletes an application and the files attached to it. The attachments go too
 * rather than lingering as orphaned rows — a deleted application shouldn't leave
 * a copy of your resume sitting in the database. The row is removed first so its
 * own foreign keys no longer point at the files.
 *
 * A file can be referenced by more than one application (reusing the same resume
 * across postings), so only files nothing else still points at are removed —
 * deleting one out from under a surviving application would violate its foreign
 * key and fail the whole delete.
 */
export async function deleteApplication(id: number): Promise<void> {
  const existing = await getApplicationById(id);
  if (!existing) return;

  await db.delete(jobApplications).where(eq(jobApplications.id, id));

  const fileIds = [existing.resumeFileId, existing.coverLetterFileId].filter(
    (fileId): fileId is number => fileId !== null
  );
  if (fileIds.length === 0) return;

  const stillReferenced = await db
    .select({
      resumeFileId: jobApplications.resumeFileId,
      coverLetterFileId: jobApplications.coverLetterFileId,
    })
    .from(jobApplications);

  const inUse = new Set<number>();
  for (const row of stillReferenced) {
    if (row.resumeFileId !== null) inUse.add(row.resumeFileId);
    if (row.coverLetterFileId !== null) inUse.add(row.coverLetterFileId);
  }

  const orphaned = fileIds.filter((fileId) => !inUse.has(fileId));
  if (orphaned.length > 0) {
    await db.delete(jobFiles).where(inArray(jobFiles.id, orphaned));
  }
}

export async function createJobFile(data: {
  kind: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  data: string;
}): Promise<FileMeta> {
  const [row] = await db
    .insert(jobFiles)
    .values(data)
    .returning({
      id: jobFiles.id,
      filename: jobFiles.filename,
      contentType: jobFiles.contentType,
      sizeBytes: jobFiles.sizeBytes,
    });
  return row;
}

export async function getJobFile(id: number): Promise<JobFile | null> {
  const rows = await db.select().from(jobFiles).where(eq(jobFiles.id, id)).limit(1);
  return rows[0] ?? null;
}
