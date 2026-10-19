import { describe, expect, it } from 'vitest';
import {
  ME_ID,
  addLateCharge,
  createCustomerRequest,
  createJob,
  customerAnswersEstimate,
  customerAnswersExtra,
  customerAnswersFinal,
  customerAnswersVisit,
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
  sendVisitPlan,
  type TryState,
} from '@/features/zipsin-repair/try/model';
import { REPAIR_TRY_STORAGE_KEY, loadTryState, saveTryState } from '@/features/zipsin-repair/try/storage';

function emptyState(): TryState {
  return { ...initialState(new Date('2026-10-18T00:00:00Z')), jobs: [] };
}

/** 직접 받은 일: 현장 견적 15만 원을 보내고 손님이 수락해 수리 중인 상태 */
function startedJob() {
  const { state, jobId } = createJob(emptyState(), { title: '욕실 누수 수리', area: '마포구', customer: '손님', ownerId: ME_ID, crew: [] });
  return { state: customerAnswersEstimate(sendEstimate(state, jobId, 150000), jobId, true), jobId };
}

/** 링크로 들어온 요청: 출장비 2만 원(수리하면 빼 줌)으로 방문해 현장 견적 15만 원을 보낸 상태 */
function quotedRequest(waived = true) {
  const created = createCustomerRequest(emptyState(), { title: '수전 교체', area: '은평구', symptom: '물이 새요', wish: '내일', photos: ['a', 'b', 'c', 'd'] });
  let state = sendVisitPlan(created.state, created.jobId, { visitAt: '내일 오후', visitFee: 20000, waived });
  state = customerAnswersVisit(state, created.jobId, true);
  state = sendEstimate(state, created.jobId, 150000);
  return { state, jobId: created.jobId };
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

describe('TEST-RP-TRY-005 방문 견적 (2026-10-19 대표 결정 A: 손님이 고른 기술자님 한 분에게)', () => {
  it('손님 요청은 나에게 들어오고 사진은 3장까지만 받는다', () => {
    const { state, jobId } = createCustomerRequest(emptyState(), { title: '수전 교체', area: '은평구', symptom: '물이 새요', wish: '내일', photos: ['a', 'b', 'c', 'd'] });
    const job = state.jobs.find((item) => item.id === jobId)!;
    expect(job.stage).toBe('request');
    expect(job.ownerId).toBe(ME_ID);
    expect(job.source).toBe('link');
    expect(job.requestPhotos).toHaveLength(3);
  });

  it('방문 약속은 출장비를 담아 손님에게 가고, 손님이 다른 시간을 원하면 다시 정한다', () => {
    const created = createCustomerRequest(emptyState(), { title: '수전 교체', area: '은평구', symptom: '', wish: '오늘', photos: [] });
    const planned = sendVisitPlan(created.state, created.jobId, { visitAt: '오늘 오후', visitFee: 20000, waived: true });
    expect(planned.jobs[0].stage).toBe('scheduled');
    expect(planned.jobs[0].visitFee).toBe(20000);
    expect(planned.jobs[0].messages.map((message) => message.kind)).toEqual(['visit']);
    const changed = customerAnswersVisit(planned, created.jobId, false);
    expect(changed.jobs[0].stage).toBe('request');
    expect(changed.jobs[0].timeChangeAsked).toBe(true);
    expect(customerAnswersVisit(planned, created.jobId, true).jobs[0].stage).toBe('before');
  });

  it('출장비 0원이면 출장비 없음으로 기록한다', () => {
    const created = createCustomerRequest(emptyState(), { title: '수전 교체', area: '은평구', symptom: '', wish: '오늘', photos: [] });
    const planned = sendVisitPlan(created.state, created.jobId, { visitAt: '오늘 오후', visitFee: 0, waived: true });
    expect(planned.jobs[0].visitFee).toBeNull();
    expect(planned.jobs[0].visitFeeWaived).toBe(false);
  });

  it('현장 견적을 보내도 손님이 수락하기 전에는 수리가 시작되지 않는다', () => {
    const { state, jobId } = quotedRequest();
    expect(state.jobs[0].stage).toBe('quoted');
    expect(requestExtra(state, jobId, 10000, '부속').jobs[0].extras).toHaveLength(0);
    expect(customerAnswersEstimate(state, jobId, true).jobs[0].stage).toBe('during');
  });

  it('손님이 수리를 안 하면 방문 견적만으로 끝나고 출장비만 남는다', () => {
    const { state, jobId } = quotedRequest();
    const job = customerAnswersEstimate(state, jobId, false).jobs[0];
    expect(job.stage).toBe('done');
    expect(job.outcome).toBe('visit_only');
    expect(finalAmount(job)).toBe(20000);
  });

  it('수리하면 빼 주는 출장비는 최종 금액에서 빠지고, 빼 주지 않으면 더해진다', () => {
    const waived = quotedRequest(true);
    const repaired = customerAnswersEstimate(waived.state, waived.jobId, true);
    const done = sendFinal(finishWork(repaired, waived.jobId, 'drop'), waived.jobId);
    expect(finalAmount(done.jobs[0])).toBe(150000);

    const charged = quotedRequest(false);
    const chargedDone = sendFinal(finishWork(customerAnswersEstimate(charged.state, charged.jobId, true), charged.jobId, 'drop'), charged.jobId);
    expect(finalAmount(chargedDone.jobs[0])).toBe(170000);
  });
});

describe('TEST-RP-TRY-002 수리 중·후 흐름이 기록 한 장이 된다', () => {
  it('직접 받은 일은 현장 견적부터 시작한다', () => {
    const { state } = createJob(emptyState(), { title: '수전 교체', area: '은평구', customer: '손님', ownerId: ME_ID, crew: [] });
    expect(state.jobs[0].stage).toBe('before');
    expect(state.jobs[0].source).toBe('direct');
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
    expect(state.jobs[0].outcome).toBe('repaired');
    expect(state.jobs[0].customerCheck).toBe('waiting');
    expect(customerAnswersFinal(state, jobId, true).jobs[0].customerCheck).toBe('confirmed');
    expect(customerAnswersFinal(state, jobId, false).jobs[0].customerCheck).toBe('disputed');
  });

  it('단계를 건너뛰는 요청은 무시한다(견적 전 추가 요청, 견적 전 완료)', () => {
    const { state, jobId } = createJob(emptyState(), { title: '수전 교체', area: '은평구', customer: '손님', ownerId: ME_ID, crew: [] });
    expect(requestExtra(state, jobId, 10000, '부속').jobs[0].extras).toHaveLength(0);
    expect(sendFinal(state, jobId).jobs[0].stage).toBe('before');
  });
});

describe('TEST-RP-TRY-003 내 이력서 숫자', () => {
  it('예시 기록으로 수리·방문 견적만·견적대로·손님 확인·팀으로 한 일을 센다', () => {
    expect(resumeStats(initialState())).toEqual({
      doneCount: 4, repairedCount: 3, visitOnlyCount: 1, confirmedCount: 4, asEstimatedCount: 2, teamCount: 1,
    });
  });
});

describe('TEST-RP-TRY-004 이 휴대폰에만 저장', () => {
  it('저장한 상태를 그대로 다시 읽는다', () => {
    const memory = new Map<string, string>();
    const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => void memory.set(key, value) };
    const { state } = quotedRequest();
    expect(saveTryState(state, storage)).toBe(true);
    expect(loadTryState(storage)).toEqual(state);
  });

  it('깨진 저장값·예전 버전·저장 실패에도 멈추지 않는다', () => {
    expect(loadTryState({ getItem: (key) => (key === REPAIR_TRY_STORAGE_KEY ? '{broken' : null) }).jobs).toHaveLength(4);
    expect(loadTryState({ getItem: () => JSON.stringify({ v: 1, jobs: [], teams: [] }) }).v).toBe(2);
    expect(saveTryState(emptyState(), { setItem: () => { throw new Error('quota'); } })).toBe(false);
  });
});
