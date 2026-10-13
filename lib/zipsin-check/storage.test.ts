import {beforeEach, describe, expect, it} from 'vitest';
import {createCandidate} from './state';
import {
  CHECK_STORAGE_KEY,
  CHECK_STORAGE_KEY_V2,
  loadCheckState,
  loadCheckStateV2,
  migrateV1ToV2,
  saveCheckState,
  saveCheckStateV2,
} from './storage';
import type {StoredCheckState} from './types';

const state: StoredCheckState = {
  schemaVersion: 1,
  candidates: [createCandidate({id: 'a', alias: 'A집', depth: 'quick', now: '2026-10-13T00:00:00.000Z'})],
  activeCandidateId: 'a',
};

beforeEach(() => localStorage.clear());

describe('집신체크 로컬 저장', () => {
  it('버전 키에 저장하고 복원한다', () => {
    expect(saveCheckState(state, localStorage)).toEqual({ok: true});
    expect(loadCheckState(localStorage)).toEqual({ok: true, state});
  });

  it('저장값이 없으면 빈 성공 결과를 돌려준다', () => {
    expect(loadCheckState(localStorage)).toEqual({ok: true, state: undefined});
  });

  it('손상 JSON을 지우지 않고 복구 가능한 오류로 돌려준다', () => {
    localStorage.setItem(CHECK_STORAGE_KEY, '{broken');

    expect(loadCheckState(localStorage)).toMatchObject({ok: false, reason: 'corrupt'});
    expect(localStorage.getItem(CHECK_STORAGE_KEY)).toBe('{broken');
  });

  it('다른 스키마 버전을 자동 변환하거나 지우지 않는다', () => {
    const raw = JSON.stringify({...state, schemaVersion: 2});
    localStorage.setItem(CHECK_STORAGE_KEY, raw);

    expect(loadCheckState(localStorage)).toMatchObject({ok: false, reason: 'version'});
    expect(localStorage.getItem(CHECK_STORAGE_KEY)).toBe(raw);
  });

  it('답변 객체와 상태·근거 값까지 검증한다', () => {
    const invalidAnswers = JSON.stringify({...state, candidates: [{...state.candidates[0], answers: null}]});
    localStorage.setItem(CHECK_STORAGE_KEY, invalidAnswers);
    expect(loadCheckState(localStorage)).toMatchObject({ok: false, reason: 'corrupt'});

    const invalidStatus = JSON.stringify({...state, candidates: [{...state.candidates[0], answers: {moisture: {status: 'great', source: 'observed'}}}]});
    localStorage.setItem(CHECK_STORAGE_KEY, invalidStatus);
    expect(loadCheckState(localStorage)).toMatchObject({ok: false, reason: 'corrupt'});
  });

  it('저장소 접근·용량 오류를 사용자 복구용 결과로 바꾼다', () => {
    const blocked = {getItem: () => { throw new Error('blocked'); }} as unknown as Storage;
    const full = {setItem: () => { throw new Error('quota'); }} as unknown as Storage;

    expect(loadCheckState(blocked)).toMatchObject({ok: false, reason: 'unavailable'});
    expect(saveCheckState(state, full)).toMatchObject({ok: false, reason: 'unavailable'});
  });
});

describe('집신체크 v2 비파괴 이전', () => {
  it('v1 후보 ID와 답을 보존해 v2로 옮긴다', () => {
    const answered = {
      ...state,
      candidates: [{...state.candidates[0], answers: {water: {status: 'confirmed' as const, source: 'observed' as const, memo: '수압 좋음'}}}],
    };
    localStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify(answered));

    const result = loadCheckStateV2(localStorage);

    expect(result).toMatchObject({ok: true, source: 'migrated-v1'});
    if (!result.ok) return;
    expect(result.state.schemaVersion).toBe(2);
    expect(result.state.candidates[0]).toMatchObject({id: 'a', intakeMode: 'simple', answers: answered.candidates[0].answers});
    expect(localStorage.getItem(CHECK_STORAGE_KEY)).toBe(JSON.stringify(answered));
  });

  it('선택 필드가 없는 v1을 반복 변환해도 같다', () => {
    expect(migrateV1ToV2(state)).toEqual(migrateV1ToV2(state));
  });

  it('손상 v2가 있어도 v1 원본을 덮어쓰지 않는다', () => {
    const rawV1 = JSON.stringify(state);
    localStorage.setItem(CHECK_STORAGE_KEY, rawV1);
    localStorage.setItem(CHECK_STORAGE_KEY_V2, '{broken');

    expect(loadCheckStateV2(localStorage)).toMatchObject({ok: false, reason: 'corrupt-v2'});
    expect(localStorage.getItem(CHECK_STORAGE_KEY)).toBe(rawV1);
    expect(localStorage.getItem(CHECK_STORAGE_KEY_V2)).toBe('{broken');
  });

  it('v2 저장 실패를 성공으로 보고하지 않는다', () => {
    const full = {setItem: () => { throw new Error('quota'); }} as unknown as Storage;
    expect(saveCheckStateV2(migrateV1ToV2(state), full)).toEqual({ok: false, reason: 'unavailable'});
  });
});
