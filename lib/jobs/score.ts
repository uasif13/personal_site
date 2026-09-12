import { z } from 'zod';
import { CRITIQUE_MODEL, extractStructured, type ContentBlock } from './anthropic';
import type { JobAnalysis, ResumeScore } from './types';

/**
 * Accepts either a real array or the comma-separated string the model sometimes
 * returns in its place. `strict: true` on the tool should prevent that, but a
 * whole resume review is too expensive to throw away over one mistyped field.
 */
const stringArray = z.preprocess(
  (value) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
      : value,
  z.array(z.string())
);

const scoreSchema = z.object({
  atsScore: z.number().min(0).max(100),
  verdict: z.string(),
  matchedKeywords: stringArray.default([]),
  missingKeywords: stringArray.default([]),
  bulletRewrites: z
    .array(
      z.object({
        original: z.string(),
        improved: z.string(),
        why: z.string(),
      })
    )
    .default([]),
  formattingIssues: stringArray.default([]),
  topActions: stringArray.default([]),
});

const INPUT_SCHEMA = {
  type: 'object',
  properties: {
    atsScore: {
      type: 'integer',
      description:
        'How well this resume clears this posting, 0-100. Calibrate honestly: 80+ means a recruiter would shortlist it as-is; 50-70 is a real but beatable gap; below 40 means the candidate is not a fit for this posting.',
    },
    verdict: {
      type: 'string',
      description: 'Two or three sentences on where this resume stands against this specific posting.',
    },
    matchedKeywords: {
      type: 'array',
      description: "Posting keywords the resume already evidences. Only include ones actually present.",
      items: { type: 'string' },
    },
    missingKeywords: {
      type: 'array',
      description:
        'Posting keywords absent from the resume that the candidate plausibly could support. Do NOT list skills the candidate has no evidence for — suggesting those invites lying on a resume.',
      items: { type: 'string' },
    },
    bulletRewrites: {
      type: 'array',
      description:
        'Concrete rewrites of existing resume bullets, at most 6, highest impact first. Rewrite only what is already on the resume — never invent experience, employers, metrics, or numbers the resume does not contain. If a bullet needs a metric the candidate must supply, write the placeholder as [X].',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string', description: 'The bullet exactly as it appears on the resume.' },
          improved: { type: 'string', description: 'The rewritten bullet.' },
          why: { type: 'string', description: 'What the rewrite fixes for this posting specifically.' },
        },
        required: ['original', 'improved', 'why'],
        additionalProperties: false,
      },
    },
    formattingIssues: {
      type: 'array',
      description:
        'Structural problems that hurt machine parsing — multi-column layouts, text in images/tables, headers an ATS skips, missing standard section titles, unparseable dates. Empty if the format is clean.',
      items: { type: 'string' },
    },
    topActions: {
      type: 'array',
      description: 'The highest-impact changes to make before submitting, ordered, at most 5.',
      items: { type: 'string' },
    },
  },
  required: [
    'atsScore',
    'verdict',
    'matchedKeywords',
    'missingKeywords',
    'bulletRewrites',
    'formattingIssues',
    'topActions',
  ],
  additionalProperties: false,
} as const;

const SYSTEM = `You are a technical recruiter who screens resumes and an expert on how applicant tracking systems parse them. You are reviewing one resume against one job posting, before the candidate applies.

Your job is to make this candidate's real experience land as well as it honestly can:
- Never invent experience, employers, dates, titles, metrics, or skills. Every rewrite must be traceable to something already on the resume. Where a number would strengthen a bullet but the resume doesn't give one, write [X] for the candidate to fill in.
- Never advise adding a keyword the candidate has no evidence for. Keyword-stuffing a resume with unbacked skills gets people caught in interviews; say so if the gap is real and unfixable.
- Be specific and blunt. "Add more metrics" is useless; naming the bullet and showing the rewrite is not.
- Score honestly. An inflated score costs the candidate a real application.`;

/**
 * Grades a resume against a posting and returns tailored, non-fabricating edits.
 * `resume` is the uploaded file — a PDF is passed through natively so layout and
 * parseability can be judged, not just the text.
 */
export async function scoreResumeAgainstJob(
  resume: { data: string; contentType: string; filename: string },
  description: string,
  positionName: string,
  company: string,
  analysis: JobAnalysis | null
): Promise<ResumeScore> {
  const isPdf = resume.contentType === 'application/pdf';

  const briefing = [
    positionName && `Position: ${positionName}`,
    company && `Company: ${company}`,
    '',
    'Job description:',
    description,
    analysis
      ? `\nAlready-extracted requirements for this posting:\n- Must-haves: ${analysis.mustHaves.join('; ') || 'none listed'}\n- Key skills: ${analysis.topSkills.map((s) => `${s.name} (${s.importance})`).join('; ') || 'none listed'}\n- Likely ATS keywords: ${analysis.atsKeywords.join('; ') || 'none listed'}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const content: ContentBlock[] = isPdf
    ? [
        { type: 'text', text: 'The candidate resume is attached as a PDF.' },
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: resume.data },
        },
        { type: 'text', text: briefing },
      ]
    : [
        {
          type: 'text',
          text: `Candidate resume (${resume.filename}):\n\n${Buffer.from(resume.data, 'base64').toString('utf8')}`,
        },
        { type: 'text', text: briefing },
      ];

  const score = await extractStructured({
    model: CRITIQUE_MODEL,
    system: SYSTEM,
    content,
    schema: INPUT_SCHEMA as unknown as Record<string, unknown>,
    toolName: 'record_resume_review',
    toolDescription: 'Record the ATS score and tailored resume adjustments for this posting.',
    maxTokens: 8192,
    validate: (raw) => scoreSchema.parse(raw),
  });

  return { ...score, scoredAt: new Date().toISOString() };
}
