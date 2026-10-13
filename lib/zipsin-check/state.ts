import {CHECK_ITEMS, CORE_ITEM_IDS, getItemsForDepth} from './catalog';
import type {Candidate, CandidateV2, CheckAnswer, CheckDepth, CheckSummary, ComparisonRow, StoredCheckStateV2} from './types';

type NewCandidate = {id: string; alias: string; depth: CheckDepth; now: string; locationLabel?: string; discoverySource?: string; housingType?: string; transactionType?: string};

export function createCandidate({id, alias, depth, now, locationLabel, discoverySource, housingType, transactionType}: NewCandidate): Candidate {
  return {
    id,
    alias: alias.trim() || '후보 1',
    depth,
    ...(locationLabel?.trim() ? {locationLabel: locationLabel.trim()} : {}),
    ...(discoverySource ? {discoverySource} : {}),
    ...(housingType ? {housingType} : {}),
    ...(transactionType ? {transactionType} : {}),
    answers: {},
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function answerItem(candidate: Candidate, itemId: string, answer: CheckAnswer, now: string): Candidate {
  if (!CHECK_ITEMS.some((item) => item.id === itemId)) throw new Error('존재하지 않는 체크 항목입니다.');
  return {...candidate, answers: {...candidate.answers, [itemId]: answer}, updatedAt: now};
}

export function switchDepth(candidate: Candidate, depth: CheckDepth, now: string): Candidate {
  return {...candidate, depth, updatedAt: now};
}

export function buildSummary(candidate: Candidate): CheckSummary {
  const summary: CheckSummary = {confirmed: [], caution: [], unverified: [], expert: []};

  for (const item of getItemsForDepth(candidate.depth)) {
    const answer = candidate.answers[item.id] ?? {status: 'unverified' as const, source: 'observed' as const};
    summary[answer.status].push({...item, answer});
  }

  return summary;
}

export function compareCandidates(candidates: Candidate[]): ComparisonRow[] {
  const active = candidates.filter((candidate) => !candidate.archived).slice(0, 3);
  return CORE_ITEM_IDS.map((itemId) => {
    const item = CHECK_ITEMS.find((candidateItem) => candidateItem.id === itemId);
    if (!item) throw new Error('공통 체크 항목을 찾을 수 없습니다.');
    return {
      item,
      answers: Object.fromEntries(active.map((candidate) => [candidate.id, candidate.answers[itemId]])),
    };
  });
}

export function archiveCandidate(candidates: Candidate[], id: string, now: string): Candidate[] {
  return candidates.map((candidate) => candidate.id === id ? {...candidate, archived: true, updatedAt: now} : candidate);
}

export function restoreCandidate(candidates: Candidate[], id: string, now: string): Candidate[] {
  if (candidates.filter((candidate) => !candidate.archived).length >= 3) {
    throw new Error('비교할 후보는 최대 3개까지 둘 수 있어요.');
  }
  return candidates.map((candidate) => candidate.id === id ? {...candidate, archived: false, updatedAt: now} : candidate);
}

const SENSITIVE_PATTERNS = [
  /(?:비밀번호|도어락|공동현관|출입문)\s*(?:은|는|:)?\s*\d{3,}/i,
  /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/,
];

export function containsSensitiveMemo(value: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));
}

type NewCandidateV2 = {id: string; alias: string; index: number; now: string; intakeMode?: 'simple' | 'detailed'};

export function createCandidateV2({id, alias, index, now, intakeMode = 'simple'}: NewCandidateV2): CandidateV2 {
  return {
    id,
    alias: alias.trim() || `오늘 본 집 ${index}`,
    intakeMode,
    depth: 'quick',
    listing: {},
    terms: {},
    contact: {},
    commute: {},
    answers: {},
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateCandidateDetails(
  candidate: CandidateV2,
  details: Partial<Pick<CandidateV2, 'alias' | 'intakeMode' | 'listing' | 'terms' | 'contact' | 'commute'>>,
  now: string,
): CandidateV2 {
  return {
    ...candidate,
    ...details,
    alias: details.alias === undefined ? candidate.alias : details.alias.trim() || candidate.alias,
    listing: {...candidate.listing, ...details.listing},
    terms: {...candidate.terms, ...details.terms},
    contact: {...candidate.contact, ...details.contact},
    commute: {...candidate.commute, ...details.commute},
    updatedAt: now,
  };
}

export function toggleComparison(ids: string[], candidateId: string): {ok: true; ids: string[]} | {ok: false; reason: 'max-three'} {
  const unique = [...new Set(ids)];
  if (unique.includes(candidateId)) return {ok: true, ids: unique.filter((id) => id !== candidateId)};
  if (unique.length >= 3) return {ok: false, reason: 'max-three'};
  return {ok: true, ids: [...unique, candidateId]};
}

export function removeCandidate(state: StoredCheckStateV2, candidateId: string): StoredCheckStateV2 {
  return {
    ...state,
    candidates: state.candidates.filter((candidate) => candidate.id !== candidateId),
    compareCandidateIds: [...new Set(state.compareCandidateIds)].filter((id) => id !== candidateId && state.candidates.some((candidate) => candidate.id === id && !candidate.archived)),
    activeCandidateId: state.activeCandidateId === candidateId ? undefined : state.activeCandidateId,
  };
}
