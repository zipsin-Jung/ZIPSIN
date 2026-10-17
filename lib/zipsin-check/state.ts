import {ALL_CHECK_ITEMS, CHECK_ITEMS, CORE_ITEM_IDS} from './catalog';
import type {Candidate, CandidateV2, CheckAnswer, CheckDepth, CheckStatus, CheckSummary, ComparisonRow, StoredCheckStateV2} from './types';
import {formatRentalPrice,formatWon,monthlyHousingCost} from './format';

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
  if (!ALL_CHECK_ITEMS.some((item) => item.id === itemId)) throw new Error('존재하지 않는 체크 항목입니다.');
  return {...candidate, answers: {...candidate.answers, [itemId]: answer}, updatedAt: now};
}

export function switchDepth(candidate: Candidate, depth: CheckDepth, now: string): Candidate {
  return {...candidate, depth, updatedAt: now};
}

export function buildSummary(candidate: Candidate): CheckSummary {
  const summary: CheckSummary = {confirmed: [], caution: [], unverified: [], expert: []};

  for (const item of CHECK_ITEMS) {
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

export type HomeComparisonRow={key:string;label:string;values:Record<string,string>;statuses?:Record<string,CheckStatus|'unanswered'>};
export function buildHomeComparison(candidates:CandidateV2[],ids:string[]):HomeComparisonRow[]{const selected=[...new Set(ids)].map(id=>candidates.find(c=>c.id===id&&!c.archived)).filter((c):c is CandidateV2=>!!c).slice(0,3);const values=(read:(c:CandidateV2)=>string)=>Object.fromEntries(selected.map(c=>[c.id,read(c)]));const rows:HomeComparisonRow[]=[
{key:'location',label:'위치',values:values(c=>c.listing.location||'미입력')},{key:'price',label:'보증금·월세',values:values(c=>formatRentalPrice(c.terms.depositWon,c.terms.monthlyRentWon))},{key:'maintenance',label:'관리비',values:values(c=>formatWon(c.terms.maintenanceFeeWon))},{key:'monthly-total',label:'월 고정 주거비',values:values(c=>formatWon(monthlyHousingCost(c.terms.monthlyRentWon,c.terms.maintenanceFeeWon)))},{key:'commute',label:'출퇴근',values:values(c=>c.commute.minutes===undefined?'미입력':`${c.commute.minutes}분`)},{key:'move-in',label:'입주일',values:values(c=>c.terms.moveInDate||'미입력')},{key:'discovery',label:'발견 경로',values:values(c=>c.listing.discoverySource||'미입력')},
...CHECK_ITEMS.map(item=>({key:item.id,label:item.title,values:values(c=>{const s=c.answers[item.id]?.status;return s==='confirmed'?'문제없음':s==='caution'?'문제 있음':s==='expert'?'전문가 확인':s==='unverified'?'못 봤음':'체크 안 함'}),statuses:Object.fromEntries(selected.map(c=>[c.id,c.answers[item.id]?.status??'unanswered']))})),
{key:'follow-up-count',label:'다시 확인',values:values(c=>`${CHECK_ITEMS.filter(i=>c.answers[i.id]?.status==='caution'||c.answers[i.id]?.status==='expert').length}개`)},{key:'contact',label:'담당자',values:values(c=>c.contact.name||'미입력')},{key:'listing',label:'매물 링크',values:values(c=>c.listing.listingUrl?'매물 보기':'미입력')}];return rows}
