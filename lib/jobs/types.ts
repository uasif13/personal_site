export const JOB_STATUSES = [
  { value: 'to_apply', label: 'To apply' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' },
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number]['value'];

export const JOB_STATUS_VALUES = JOB_STATUSES.map((s) => s.value) as [
  JobStatus,
  ...JobStatus[],
];

export function statusLabel(value: string): string {
  return JOB_STATUSES.find((s) => s.value === value)?.label ?? value;
}

/** A skill or technology pulled out of a job description, ranked by how central it is. */
export interface ExtractedSkill {
  name: string;
  /** 'required' outranks 'preferred' outranks 'mentioned' when ordering. */
  importance: 'required' | 'preferred' | 'mentioned';
  /** Why the analyzer thinks it matters — quoted or paraphrased from the posting. */
  evidence: string;
}

export interface JobAnalysis {
  /** The handful of things this posting actually screens on, most important first. */
  topSkills: ExtractedSkill[];
  technologies: string[];
  /** Free text, e.g. "3-5 years" or "Not specified" — seeds the editable field. */
  yearsExperience: string;
  seniority: string;
  keyResponsibilities: string[];
  mustHaves: string[];
  niceToHaves: string[];
  /** Literal phrases an ATS keyword filter is likely to match on. */
  atsKeywords: string[];
  analyzedAt: string;
}

export interface BulletRewrite {
  original: string;
  improved: string;
  why: string;
}

export interface ResumeScore {
  /** 0-100 estimate of how well this resume clears the posting's ATS screen. */
  atsScore: number;
  verdict: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  bulletRewrites: BulletRewrite[];
  formattingIssues: string[];
  /** Ordered highest-impact-first: what to change before hitting submit. */
  topActions: string[];
  scoredAt: string;
}
