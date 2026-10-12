import {describe, expect, it} from 'vitest';
import {CORE_ITEM_IDS} from './catalog';
import {
  answerItem,
  archiveCandidate,
  buildSummary,
  compareCandidates,
  createCandidate,
  containsSensitiveMemo,
  restoreCandidate,
  switchDepth,
} from './state';

const now = '2026-10-13T00:00:00.000Z';

describe('집신체크 상태 규칙', () => {
  it('후보를 만들고 답변과 모드 전환을 불변 방식으로 보존한다', () => {
    const candidate = createCandidate({id: 'a', alias: '', depth: 'quick', now});
    const answered = answerItem(candidate, 'moisture', {status: 'caution', source: 'observed', memo: '창가 얼룩'}, now);
    const thorough = switchDepth(answered, 'thorough', now);

    expect(candidate.alias).toBe('후보 1');
    expect(candidate.answers).toEqual({});
    expect(thorough.answers.moisture.status).toBe('caution');
    expect(thorough.depth).toBe('thorough');
  });

  it('미응답 핵심은 미확인으로 모으고 주의를 별도로 유지한다', () => {
    let candidate = createCandidate({id: 'a', alias: '첫 번째 집', depth: 'quick', now});
    candidate = answerItem(candidate, 'moisture', {status: 'caution', source: 'observed'}, now);
    candidate = answerItem(candidate, 'light-air', {status: 'confirmed', source: 'observed'}, now);

    const summary = buildSummary(candidate);

    expect(summary.caution.map((entry) => entry.id)).toEqual(['moisture']);
    expect(summary.confirmed.map((entry) => entry.id)).toEqual(['light-air']);
    expect(summary.unverified).toHaveLength(CORE_ITEM_IDS.length - 2);
  });

  it('서로 다른 깊이의 후보도 공통 핵심만 비교한다', () => {
    const quick = createCandidate({id: 'a', alias: 'A집', depth: 'quick', now});
    const thorough = answerItem(
      createCandidate({id: 'b', alias: 'B집', depth: 'thorough', now}),
      'outlets',
      {status: 'caution', source: 'observed'},
      now,
    );

    const rows = compareCandidates([quick, thorough]);

    expect(rows).toHaveLength(CORE_ITEM_IDS.length);
    expect(rows.some((row) => row.item.id === 'outlets')).toBe(false);
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
