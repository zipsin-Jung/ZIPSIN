export type CheckDepth = 'quick' | 'thorough';
export type IntakeMode = 'simple' | 'detailed';
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
  locationLabel?: string;
  discoverySource?: string;
  housingType?: string;
  transactionType?: string;
  answers: Record<string, CheckAnswer>;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListingInfo = {
  location?: string;
  discoverySource?: string;
  housingType?: string;
  listingUrl?: string;
};

export type RentalTerms = {
  transactionType?: string;
  depositWon?: number;
  monthlyRentWon?: number;
  maintenanceFeeWon?: number;
  moveInDate?: string;
};

export type ContactInfo = {name?: string; phone?: string};
export type CommuteInfo = {minutes?: number; destination?: string};

export type CandidateV2 = {
  id: string;
  alias: string;
  intakeMode: IntakeMode;
  depth: CheckDepth;
  listing: ListingInfo;
  terms: RentalTerms;
  contact: ContactInfo;
  commute: CommuteInfo;
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

export type StoredCheckStateV2 = {
  schemaVersion: 2;
  candidates: CandidateV2[];
  compareCandidateIds: string[];
  activeCandidateId?: string;
};

export type SummaryEntry = CheckItem & {answer: CheckAnswer};
export type CheckSummary = Record<CheckStatus, SummaryEntry[]>;

export type ComparisonRow = {
  item: CheckItem;
  answers: Record<string, CheckAnswer | undefined>;
};
