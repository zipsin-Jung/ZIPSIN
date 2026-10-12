import {beforeEach, describe, expect, it} from 'vitest';
import {createCandidate} from './state';
import {CHECK_STORAGE_KEY, loadCheckState, saveCheckState} from './storage';
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

  it('저장소 접근·용량 오류를 사용자 복구용 결과로 바꾼다', () => {
    const blocked = {getItem: () => { throw new Error('blocked'); }} as unknown as Storage;
    const full = {setItem: () => { throw new Error('quota'); }} as unknown as Storage;

    expect(loadCheckState(blocked)).toMatchObject({ok: false, reason: 'unavailable'});
    expect(saveCheckState(state, full)).toMatchObject({ok: false, reason: 'unavailable'});
  });
});
