import type {Candidate, CheckAnswer, EvidenceSource, CheckStatus, StoredCheckState} from './types';

export const CHECK_STORAGE_KEY = 'zipsin-check:v1';

type LoadResult =
  | {ok: true; state: StoredCheckState | undefined}
  | {ok: false; reason: 'corrupt' | 'version' | 'unavailable'; raw?: string};

type SaveResult = {ok: true} | {ok: false; reason: 'unavailable'};

const STATUSES = new Set<CheckStatus>(['confirmed', 'caution', 'unverified', 'expert']);
const SOURCES = new Set<EvidenceSource>(['observed', 'explained', 'document', 'expert']);

function isAnswer(value: unknown): value is CheckAnswer {
  if (!value || typeof value !== 'object') return false;
  const answer = value as Partial<CheckAnswer>;
  return STATUSES.has(answer.status as CheckStatus)
    && SOURCES.has(answer.source as EvidenceSource)
    && (answer.memo === undefined || typeof answer.memo === 'string');
}

function isCandidate(value: unknown): value is Candidate {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Candidate>;
  return typeof candidate.id === 'string'
    && typeof candidate.alias === 'string'
    && (candidate.depth === 'quick' || candidate.depth === 'thorough')
    && !!candidate.answers
    && typeof candidate.answers === 'object'
    && !Array.isArray(candidate.answers)
    && Object.values(candidate.answers).every(isAnswer)
    && typeof candidate.archived === 'boolean'
    && typeof candidate.createdAt === 'string'
    && typeof candidate.updatedAt === 'string'
    && isOptionalString(candidate.locationLabel)
    && isOptionalString(candidate.discoverySource)
    && isOptionalString(candidate.housingType)
    && isOptionalString(candidate.transactionType);
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isStoredCheckState(value: unknown): value is StoredCheckState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<StoredCheckState>;
  return state.schemaVersion === 1
    && Array.isArray(state.candidates)
    && state.candidates.every(isCandidate)
    && (state.activeCandidateId === undefined || typeof state.activeCandidateId === 'string');
}

export function loadCheckState(storage: Storage): LoadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(CHECK_STORAGE_KEY);
  } catch {
    return {ok: false, reason: 'unavailable'};
  }
  if (raw === null) return {ok: true, state: undefined};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {ok: false, reason: 'corrupt', raw};
  }
  if ((parsed as {schemaVersion?: unknown})?.schemaVersion !== 1) {
    return {ok: false, reason: 'version', raw};
  }
  if (!isStoredCheckState(parsed)) return {ok: false, reason: 'corrupt', raw};
  return {ok: true, state: parsed};
}

export function saveCheckState(state: StoredCheckState, storage: Storage): SaveResult {
  try {
    storage.setItem(CHECK_STORAGE_KEY, JSON.stringify(state));
    return {ok: true};
  } catch {
    return {ok: false, reason: 'unavailable'};
  }
}
