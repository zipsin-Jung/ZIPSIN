import {describe, expect, it} from 'vitest';
import {CHECK_ITEMS, CORE_ITEM_IDS} from './catalog';
import {
  answerItem,
  archiveCandidate,
  buildSummary,
  buildHomeComparison,
  compareCandidates,
  createCandidate,
  containsSensitiveMemo,
  restoreCandidate,
  switchDepth,
  createCandidateV2,
  removeCandidate,
  toggleComparison,
  updateCandidateDetails,
} from './state';
import type {StoredCheckStateV2} from './types';

const now = '2026-10-13T00:00:00.000Z';

describe('집신체크 상태 규칙', () => {
  it('후보를 만들고 답변과 모드 전환을 불변 방식으로 보존한다', () => {
    const candidate = createCandidate({id: 'a', alias: '', depth: 'quick', now});
    const answered = answerItem(candidate, 'moisture-leak', {status: 'caution', source: 'observed', memo: '창가 얼룩'}, now);
    const thorough = switchDepth(answered, 'thorough', now);

    expect(candidate.alias).toBe('후보 1');
    expect(candidate.answers).toEqual({});
    expect(thorough.answers['moisture-leak'].status).toBe('caution');
    expect(thorough.depth).toBe('thorough');
  });

  it('미응답 핵심은 미확인으로 모으고 주의를 별도로 유지한다', () => {
    let candidate = createCandidate({id: 'a', alias: '첫 번째 집', depth: 'quick', now});
    candidate = answerItem(candidate, 'moisture-leak', {status: 'caution', source: 'observed'}, now);
    candidate = answerItem(candidate, 'light-noise', {status: 'confirmed', source: 'observed'}, now);

    const summary = buildSummary(candidate);

    expect(summary.caution.map((entry) => entry.id)).toEqual(['moisture-leak']);
    expect(summary.confirmed.map((entry) => entry.id)).toEqual(['light-noise']);
    expect(summary.unverified).toHaveLength(CHECK_ITEMS.length - 2);
  });

  it('서로 다른 깊이의 후보도 공통 핵심만 비교한다', () => {
    const quick = createCandidate({id: 'a', alias: 'A집', depth: 'quick', now});
    const thorough = answerItem(
      createCandidate({id: 'b', alias: 'B집', depth: 'thorough', now}),
      'options-damage',
      {status: 'caution', source: 'observed'},
      now,
    );

    const rows = compareCandidates([quick, thorough]);

    expect(rows).toHaveLength(CORE_ITEM_IDS.length);
    expect(rows.some((row) => row.item.id === 'hot-water-heating')).toBe(true);
  });

  it('후보를 삭제하지 않고 제외·복원하며 활성 후보는 3개까지만 둔다', () => {
    const candidates = ['a', 'b', 'c'].map((id, index) => createCandidate({id, alias: `${index + 1}집`, depth: 'quick', now}));
    expect(() => restoreCandidate([...candidates, {...createCandidate({id: 'd', alias: '4집', depth: 'quick', now}), archived: true}], 'd', now)).toThrow(/3개/);

    const archived = archiveCandidate(candidates, 'b', now);
    const restored = restoreCandidate(archived, 'b', now);

    expect(archived.find((item) => item.id === 'b')?.archived).toBe(true);
    expect(restored.find((item) => item.id === 'b')?.archived).toBe(false);
    expect(restored).toHaveLength(3);
  });

  it('출입 비밀번호처럼 저장하면 위험한 메모를 감지한다', () => {
    expect(containsSensitiveMemo('공동현관 비밀번호 1234')).toBe(true);
    expect(containsSensitiveMemo('중개사 연락처 010-1234-5678')).toBe(true);
    expect(containsSensitiveMemo('창가에 작은 얼룩 있음')).toBe(false);
  });
});

describe('v2 후보 수명주기', () => {
  it('자동 별명과 공백 제거를 지원하고 10채 이상 보관한다', () => {
    const homes = Array.from({length: 12}, (_, index) => createCandidateV2({id: String(index), alias: index ? `  ${index}집  ` : '', index: index + 1, now}));
    expect(homes[0].alias).toBe('오늘 본 집 1');
    expect(homes[1].alias).toBe('1집');
    expect(homes).toHaveLength(12);
  });

  it('비교 선택 순서를 유지하고 네 번째는 기록 삭제 없이 거부한다', () => {
    expect(toggleComparison([], 'b')).toEqual({ok: true, ids: ['b']});
    expect(toggleComparison(['b'], 'a')).toEqual({ok: true, ids: ['b', 'a']});
    expect(toggleComparison(['b', 'a', 'c'], 'd')).toEqual({ok: false, reason: 'max-three'});
    expect(toggleComparison(['b', 'a'], 'b')).toEqual({ok: true, ids: ['a']});
  });

  it('상세 수정이 기존 답을 보존한다', () => {
    const candidate = {...createCandidateV2({id: 'a', alias: 'A', index: 1, now}), answers: {water: {status: 'caution' as const, source: 'observed' as const}}};
    const updated = updateCandidateDetails(candidate, {intakeMode: 'detailed', listing: {location: '망원동'}}, now);
    expect(updated.listing.location).toBe('망원동');
    expect(updated.answers).toEqual(candidate.answers);
  });

  it('영구 삭제가 후보·활성·비교 ID를 함께 정리한다', () => {
    const candidates = ['a', 'b'].map((id, index) => createCandidateV2({id, alias: id, index: index + 1, now}));
    const stored: StoredCheckStateV2 = {schemaVersion: 2, candidates, activeCandidateId: 'a', compareCandidateIds: ['a', 'b', 'a', 'missing']};
    expect(removeCandidate(stored, 'a')).toMatchObject({candidates: [{id: 'b'}], compareCandidateIds: ['b'], activeCandidateId: undefined});
  });

  it('전문가 확인을 비교표에서 미확인으로 약화하지 않는다', () => {
    const a={...createCandidateV2({id:'a',alias:'A',index:1,now}),answers:{'options-damage':{status:'expert' as const,source:'expert' as const}}};
    const b=createCandidateV2({id:'b',alias:'B',index:2,now});
    const rows=buildHomeComparison([a,b],['a','b']);
    expect(rows.find(row=>row.key==='options-damage')?.values.a).toBe('전문가 확인');
    expect(rows.find(row=>row.key==='follow-up-count')?.values.a).toBe('1개');
  });
});
