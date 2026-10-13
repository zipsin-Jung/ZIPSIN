import {CHECK_ITEMS,LEGACY_ITEM_IDS_BY_FIELD} from './catalog';
import type {Candidate, CandidateV2, CheckAnswer, EvidenceSource, CheckStatus, StoredCheckState, StoredCheckStateV2} from './types';

export const CHECK_STORAGE_KEY = 'zipsin-check:v1';
export const CHECK_STORAGE_KEY_V2 = 'zipsin-check:v2';

type LoadResult =
  | {ok: true; state: StoredCheckState | undefined}
  | {ok: false; reason: 'corrupt' | 'version' | 'unavailable'; raw?: string};

type SaveResult = {ok: true} | {ok: false; reason: 'unavailable'};
type LoadResultV2 =
  | {ok: true; state: StoredCheckStateV2; source: 'v2' | 'migrated-v1' | 'empty'}
  | {ok: false; reason: 'corrupt-v2' | 'version-v2' | 'unavailable' | 'migration-save-failed'; raw?: string};

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

function isOptionalSafeNumber(value: unknown) {
  return value === undefined || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0);
}

function hasOnlyOptionalStrings(value: unknown, keys: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return keys.every((key) => isOptionalString(record[key]));
}

function isCandidateV2(value: unknown): value is CandidateV2 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CandidateV2>;
  return typeof candidate.id === 'string'
    && typeof candidate.alias === 'string'
    && (candidate.intakeMode === 'simple' || candidate.intakeMode === 'detailed')
    && (candidate.depth === 'quick' || candidate.depth === 'thorough')
    && hasOnlyOptionalStrings(candidate.listing, ['location', 'discoverySource', 'housingType', 'listingUrl'])
    && !!candidate.terms && typeof candidate.terms === 'object' && !Array.isArray(candidate.terms)
    && isOptionalString(candidate.terms.transactionType)
    && isOptionalSafeNumber(candidate.terms.depositWon)
    && isOptionalSafeNumber(candidate.terms.monthlyRentWon)
    && isOptionalSafeNumber(candidate.terms.maintenanceFeeWon)
    && isOptionalString(candidate.terms.moveInDate)
    && hasOnlyOptionalStrings(candidate.contact, ['name', 'phone'])
    && !!candidate.commute && typeof candidate.commute === 'object' && !Array.isArray(candidate.commute)
    && isOptionalSafeNumber(candidate.commute.minutes)
    && isOptionalString(candidate.commute.destination)
    && !!candidate.answers && typeof candidate.answers === 'object' && !Array.isArray(candidate.answers)
    && Object.values(candidate.answers).every(isAnswer)
    && typeof candidate.archived === 'boolean'
    && typeof candidate.createdAt === 'string'
    && typeof candidate.updatedAt === 'string';
}

function normalizeCompareIds(ids: unknown, candidates: CandidateV2[]) {
  if (!Array.isArray(ids)) return [];
  const active = new Set(candidates.filter((candidate) => !candidate.archived).map((candidate) => candidate.id));
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && active.has(id)))].slice(0, 3);
}

function isStoredCheckStateV2(value: unknown): value is StoredCheckStateV2 {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<StoredCheckStateV2>;
  return state.schemaVersion === 2
    && Array.isArray(state.candidates)
    && state.candidates.every(isCandidateV2)
    && Array.isArray(state.compareCandidateIds)
    && state.compareCandidateIds.every((id) => typeof id === 'string')
    && (state.activeCandidateId === undefined || typeof state.activeCandidateId === 'string');
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

export function migrateV1ToV2(v1: StoredCheckState): StoredCheckStateV2 {
  const candidates = v1.candidates.map((candidate) => ({
    id: candidate.id,
    alias: candidate.alias,
    intakeMode: 'simple' as const,
    depth: candidate.depth,
    listing: {
      location: candidate.locationLabel,
      discoverySource: candidate.discoverySource,
      housingType: candidate.housingType,
    },
    terms: {transactionType: candidate.transactionType},
    contact: {},
    commute: {},
    answers: migrateAnswers(candidate.answers),
    archived: candidate.archived,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  }));
  return {
    schemaVersion: 2,
    candidates,
    compareCandidateIds: normalizeCompareIds(candidates.filter((candidate) => !candidate.archived).slice(0, 3).map((candidate) => candidate.id), candidates),
    activeCandidateId: v1.activeCandidateId,
  };
}

const STATUS_WEIGHT:Record<CheckStatus,number>={unverified:0,confirmed:1,caution:2,expert:3};
function migrateAnswers(answers:Record<string,CheckAnswer>){const next={...answers};for(const item of CHECK_ITEMS){const legacy=LEGACY_ITEM_IDS_BY_FIELD[item.id as keyof typeof LEGACY_ITEM_IDS_BY_FIELD].flatMap(id=>answers[id]?[{id,answer:answers[id]}]:[]);if(!legacy.length||next[item.id])continue;const strongest=[...legacy].sort((a,b)=>STATUS_WEIGHT[b.answer.status]-STATUS_WEIGHT[a.answer.status])[0].answer;const memos=legacy.flatMap(entry=>entry.answer.memo?[`${entry.id}: ${entry.answer.memo}`]:[]);next[item.id]={...strongest,...(memos.length?{memo:memos.join(' · ')}:{})}}return next}

export function saveCheckStateV2(state: StoredCheckStateV2, storage: Storage): SaveResult {
  try {
    storage.setItem(CHECK_STORAGE_KEY_V2, JSON.stringify(state));
    return {ok: true};
  } catch {
    return {ok: false, reason: 'unavailable'};
  }
}

export function loadCheckStateV2(storage: Storage): LoadResultV2 {
  let rawV2: string | null;
  try {
    rawV2 = storage.getItem(CHECK_STORAGE_KEY_V2);
  } catch {
    return {ok: false, reason: 'unavailable'};
  }
  if (rawV2 !== null) {
    let parsed: unknown;
    try { parsed = JSON.parse(rawV2); } catch { return {ok: false, reason: 'corrupt-v2', raw: rawV2}; }
    if ((parsed as {schemaVersion?: unknown})?.schemaVersion !== 2) return {ok: false, reason: 'version-v2', raw: rawV2};
    if (!isStoredCheckStateV2(parsed)) return {ok: false, reason: 'corrupt-v2', raw: rawV2};
    return {
      ok: true,
      source: 'v2',
      state: {...parsed, compareCandidateIds: normalizeCompareIds(parsed.compareCandidateIds, parsed.candidates)},
    };
  }

  const loadedV1 = loadCheckState(storage);
  if (!loadedV1.ok) return {ok: false, reason: loadedV1.reason === 'unavailable' ? 'unavailable' : 'corrupt-v2', raw: loadedV1.raw};
  if (!loadedV1.state) return {ok: true, source: 'empty', state: {schemaVersion: 2, candidates: [], compareCandidateIds: []}};
  const migrated = migrateV1ToV2(loadedV1.state);
  if (!saveCheckStateV2(migrated, storage).ok) return {ok: false, reason: 'migration-save-failed'};
  return {ok: true, source: 'migrated-v1', state: migrated};
}
