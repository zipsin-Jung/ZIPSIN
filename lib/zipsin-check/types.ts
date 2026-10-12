export type CheckDepth = 'quick' | 'thorough';
export type CheckStatus = 'confirmed' | 'caution' | 'unverified' | 'expert';
export type EvidenceSource = 'observed' | 'explained' | 'document' | 'expert';

export type CheckAnswer = {
  status: CheckStatus;
  source: EvidenceSource;
  memo?: string;
};

export type CheckItem = {
  id: string;
  group: string;
  core: boolean;
  title: string;
  prompt: string;
  why: string;
  how: string;
  question: string;
  nextAction: string;
  reviewedAt?: string;
};

export type Candidate = {
  id: string;
  alias: string;
  depth: CheckDepth;
  answers: Record<string, CheckAnswer>;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoredCheckState = {
  schemaVersion: 1;
  candidates: Candidate[];
  activeCandidateId?: string;
};

export type SummaryEntry = CheckItem & {answer: CheckAnswer};
export type CheckSummary = Record<CheckStatus, SummaryEntry[]>;

export type ComparisonRow = {
  item: CheckItem;
  answers: Record<string, CheckAnswer | undefined>;
};
