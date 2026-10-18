import { describe, expect, it } from 'vitest';
import {
  ME_ID,
  addLateCharge,
  createJob,
  customerAnswersExtra,
  customerAnswersFinal,
  finalAmount,
  finishWork,
  formatWon,
  hasLateCharge,
  initialState,
  parseWon,
  requestExtra,
  resumeStats,
  sendEstimate,
  sendFinal,
  type TryState,
} from '@/features/zipsin-repair/try/model';
import { REPAIR_TRY_STORAGE_KEY, loadTryState, saveTryState } from '@/features/zipsin-repair/try/storage';

function emptyState(): TryState {
  return { ...initialState(new Date('2026-10-18T00:00:00Z')), jobs: [] };
}

function startedJob() {
  const { state, jobId } = createJob(emptyState(), { title: '욕실 누수 수리', area: '마포구', customer: '손님', ownerId: ME_ID, crew: [] });
  return { state: sendEstimate(state, jobId, 150000), jobId };
}

describe('TEST-RP-TRY-001 금액 읽기·쓰기', () => {
  it('만 원 단위로 읽기 쉽게 보여 준다', () => {
    expect(formatWon(150000)).toBe('15만 원');
    expect(formatWon(155000)).toBe('15만 5,000원');
    expect(formatWon(8000)).toBe('8,000원');
  });

  it('숫자·쉼표·만 단위 입력을 모두 읽는다', () => {
    expect(parseWon('150000')).toBe(150000);
    expect(parseWon('150,000원')).toBe(150000);
    expect(parseWon('15만')).toBe(150000);
    expect(parseWon('15만5000')).toBe(155000);
    expect(parseWon('abc')).toBeNull();
    expect(parseWon('0')).toBeNull();
  });
});

describe('TEST-RP-TRY-002 수리 전·중·후 흐름이 기록 한 장이 된다', () => {
  it('견적을 보내면 수리 중으로 넘어가고 손님에게 갈 알림이 남는다', () => {
    const { state, jobId } = startedJob();
    const job = state.jobs.find((item) => item.id === jobId)!;
    expect(job.stage).toBe('during');
    expect(job.messages.map((message) => message.kind)).toEqual(['estimate']);
  });

  it('손님이 동의한 추가만 최종 금액에 더해지고, 거절한 추가는 빠진다', () => {
    let { state, jobId } = startedJob();
    state = requestExtra(state, jobId, 30000, '부속 교체');
    state = requestExtra(state, jobId, 50000, '타일 보수');
    const [agree, decline] = state.jobs[0].extras;
    state = customerAnswersExtra(state, jobId, agree.id, true);
    state = customerAnswersExtra(state, jobId, decline.id, false);
    expect(finalAmount(state.jobs[0])).toBe(180000);
    expect(hasLateCharge(state.jobs[0])).toBe(false);
  });

  it('손님 동의 없이 붙인 금액은 사후 청구로 남고 최종 금액에 들어간다', () => {
    let { state, jobId } = startedJob();
    state = addLateCharge(state, jobId, 20000, '호스 교체');
    expect(state.jobs[0].extras[0].status).toBe('late');
    expect(finalAmount(state.jobs[0])).toBe(170000);
    expect(hasLateCharge(state.jobs[0])).toBe(true);
  });

  it('동의를 못 받은 추가는 끝낼 때 빼거나 사후 청구로 남길 수 있다', () => {
    const base = startedJob();
    const requested = requestExtra(base.state, base.jobId, 30000, '부속 교체');
    const dropped = finishWork(requested, base.jobId, 'drop');
    expect(dropped.jobs[0].extras).toHaveLength(0);
    expect(finalAmount(dropped.jobs[0])).toBe(150000);
    const late = finishWork(requested, base.jobId, 'late');
    expect(late.jobs[0].extras[0].status).toBe('late');
    expect(late.jobs[0].stage).toBe('after');
  });

  it('완료를 보내면 손님 확인을 기다리고, 손님은 확인 또는 집신 전달만 할 수 있다', () => {
    let { state, jobId } = startedJob();
    state = sendFinal(finishWork(state, jobId, 'drop'), jobId);
    expect(state.jobs[0].stage).toBe('done');
    expect(state.jobs[0].customerCheck).toBe('waiting');
    expect(customerAnswersFinal(state, jobId, true).jobs[0].customerCheck).toBe('confirmed');
    expect(customerAnswersFinal(state, jobId, false).jobs[0].customerCheck).toBe('disputed');
  });

  it('단계를 건너뛰는 요청은 무시한다(견적 전 추가 요청, 두 번 완료)', () => {
    const { state, jobId } = createJob(emptyState(), { title: '수전 교체', area: '은평구', customer: '손님', ownerId: ME_ID, crew: [] });
    expect(requestExtra(state, jobId, 10000, '부속').jobs[0].extras).toHaveLength(0);
    expect(sendFinal(state, jobId).jobs[0].stage).toBe('before');
  });
});

describe('TEST-RP-TRY-003 내 이력서 숫자', () => {
  it('예시 기록으로 끝낸 일·손님 확인·견적대로 끝낸 일·팀으로 한 일을 센다', () => {
    expect(resumeStats(initialState())).toEqual({ doneCount: 3, confirmedCount: 3, asEstimatedCount: 2, teamCount: 1 });
  });
});

describe('TEST-RP-TRY-004 이 휴대폰에만 저장', () => {
  it('저장한 상태를 그대로 다시 읽는다', () => {
    const memory = new Map<string, string>();
    const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => void memory.set(key, value) };
    const { state } = startedJob();
    expect(saveTryState(state, storage)).toBe(true);
    expect(loadTryState(storage)).toEqual(state);
  });

  it('깨진 저장값이나 저장 실패에도 멈추지 않는다', () => {
    expect(loadTryState({ getItem: (key) => (key === REPAIR_TRY_STORAGE_KEY ? '{broken' : null) }).jobs).toHaveLength(3);
    expect(saveTryState(emptyState(), { setItem: () => { throw new Error('quota'); } })).toBe(false);
  });
});
