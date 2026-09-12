import { z } from 'zod';
import { EXTRACTION_MODEL, extractStructured } from './anthropic';
import type { JobAnalysis } from './types';

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

const IMPORTANCE_ORDER = { required: 0, preferred: 1, mentioned: 2 } as const;

const analysisSchema = z.object({
  topSkills: z
    .array(
      z.object({
        name: z.string(),
        importance: z.enum(['required', 'preferred', 'mentioned']),
        evidence: z.string(),
      })
    )
    .default([]),
  technologies: stringArray.default([]),
  yearsExperience: z.string().default('Not specified'),
  seniority: z.string().default('Not specified'),
  keyResponsibilities: stringArray.default([]),
  mustHaves: stringArray.default([]),
  niceToHaves: stringArray.default([]),
  atsKeywords: stringArray.default([]),
});

const INPUT_SCHEMA = {
  type: 'object',
  properties: {
    topSkills: {
      type: 'array',
      description:
        'The skills and technologies this role actually screens on, most important first. At most 12.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Short canonical name, e.g. "TypeScript", "Distributed systems".' },
          importance: {
            type: 'string',
            enum: ['required', 'preferred', 'mentioned'],
            description:
              'required = listed as a hard requirement; preferred = nice-to-have or "bonus"; mentioned = appears only in passing.',
          },
          evidence: {
            type: 'string',
            description: 'Short quote or paraphrase from the posting showing why.',
          },
        },
        required: ['name', 'importance', 'evidence'],
        additionalProperties: false,
      },
    },
    technologies: {
      type: 'array',
      description: 'Concrete named technologies only — languages, frameworks, databases, cloud services, tools.',
      items: { type: 'string' },
    },
    yearsExperience: {
      type: 'string',
      description:
        'Years of experience the posting asks for, as a short phrase such as "3-5 years" or "5+ years". Use "Not specified" if absent — never guess.',
    },
    seniority: {
      type: 'string',
      description: 'Seniority level, e.g. "Intern", "New grad", "Mid-level", "Senior", "Staff". "Not specified" if absent.',
    },
    keyResponsibilities: {
      type: 'array',
      description: 'What the person will actually do day to day. At most 6 items.',
      items: { type: 'string' },
    },
    mustHaves: {
      type: 'array',
      description: 'Hard qualifications a candidate is filtered out for lacking. At most 8 items.',
      items: { type: 'string' },
    },
    niceToHaves: {
      type: 'array',
      description: 'Preferred but non-blocking qualifications. At most 8 items.',
      items: { type: 'string' },
    },
    atsKeywords: {
      type: 'array',
      description:
        'Literal phrases, exactly as written in the posting, that an applicant tracking system is most likely to keyword-match against. At most 20.',
      items: { type: 'string' },
    },
  },
  required: [
    'topSkills',
    'technologies',
    'yearsExperience',
    'seniority',
    'keyResponsibilities',
    'mustHaves',
    'niceToHaves',
    'atsKeywords',
  ],
  additionalProperties: false,
} as const;

const SYSTEM = `You are an experienced technical recruiter. You read a job posting and extract exactly what it screens candidates on.

Rules:
- Report only what the posting says. Never infer a requirement that isn't there, and never pad lists to hit a length.
- Prefer the posting's own vocabulary over synonyms — the point is to match how an applicant tracking system reads it.
- Distinguish hard requirements from preferences honestly; postings often blur them, you should not.
- If the posting is vague or truncated, say "Not specified" rather than inventing detail.`;

/** Pulls the structured findings out of a pasted job description. */
export async function analyzeJobDescription(
  description: string,
  positionName: string,
  company: string
): Promise<JobAnalysis> {
  const header = [
    positionName && `Position: ${positionName}`,
    company && `Company: ${company}`,
  ]
    .filter(Boolean)
    .join('\n');

  const analysis = await extractStructured({
    model: EXTRACTION_MODEL,
    system: SYSTEM,
    content: [
      {
        type: 'text',
        text: `${header}\n\nJob description:\n\n${description}`,
      },
    ],
    schema: INPUT_SCHEMA as unknown as Record<string, unknown>,
    toolName: 'record_job_analysis',
    toolDescription: 'Record the structured findings extracted from this job posting.',
    validate: (raw) => analysisSchema.parse(raw),
  });

  return {
    ...analysis,
    topSkills: [...analysis.topSkills].sort(
      (a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]
    ),
    analyzedAt: new Date().toISOString(),
  };
}
