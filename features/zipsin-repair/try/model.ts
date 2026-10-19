/**
 * 집신수리 체험판(2026-10-18 대표 요청: 배포 전까지 눌러볼 수 있게).
 * 실제 문자·서버 저장 없이 이 휴대폰(localStorage)에서만 움직인다. 모든 계산은 이 파일의 순수 함수로 한다.
 *
 * 원칙(기획서 '작업 기록 한 장'):
 * - 평가가 아니라 사실: 전후 사진 + 견적 + 추가(+) + 최종 금액
 * - 손님 동의 없이 붙은 금액은 '사후 청구'로 그대로 남는다
 * - 손님은 더해 줄 수만 있다: 확인/동의만 있고, 불만은 공개되지 않는다
 * - 기록은 그날의 일 한 건 단위. 누구 이름으로(나/팀) + 그날 함께한 사람
 *
 * 2026-10-19 대표 결정(A): 방문 견적은 손님이 고른 기술자님 한 분에게 요청한다(여러 업체 경쟁·매칭 아님).
 * - 출장비는 방문 전에 미리 보인다. 수리하면 빼 줄지 기술자님이 정해 함께 보인다
 * - 손님이 수리를 안 하면 '방문 견적만'으로 끝나고, 그것도 기술자님 기록이 된다
 */

export type ExtraStatus = 'requested' | 'agreed' | 'declined' | 'late';
/** request: 손님 요청 받음 → scheduled: 방문 약속 보냄 → before: 방문·현장 견적 → quoted: 견적 보냄 → during → after → done */
export type JobStage = 'request' | 'scheduled' | 'before' | 'quoted' | 'during' | 'after' | 'done';
export type CustomerCheck = 'none' | 'waiting' | 'confirmed' | 'disputed';
export type MessageKind = 'visit' | 'estimate' | 'extra' | 'final';
export type JobOutcome = 'repaired' | 'visit_only';
export type JobSource = 'link' | 'direct';

export interface Extra {
  id: string;
  amount: number;
  reason: string;
  status: ExtraStatus;
  at: string;
}

export interface Message {
  id: string;
  kind: MessageKind;
  at: string;
  extraId?: string;
}

export interface Team {
  id: string;
  name: string;
  members: string[];
}

export interface Job {
  id: string;
  title: string;
  area: string;
  customer: string;
  ownerId: string; // 'me' 또는 팀 id
  crew: string[];
  source: JobSource;
  /** 손님이 견적 요청 때 남긴 것 */
  symptom: string;
  wish: string;
  requestPhotos: string[];
  /** 방문 약속 */
  visitAt: string | null;
  visitFee: number | null;
  visitFeeWaived: boolean;
  timeChangeAsked: boolean;
  estimate: number | null;
  extras: Extra[];
  photosBefore: string[];
  photosAfter: string[];
  stage: JobStage;
  outcome: JobOutcome | null;
  customerCheck: CustomerCheck;
  messages: Message[];
  createdAt: string;
  doneAt?: string;
  isExample?: boolean;
}

export interface TryState {
  v: 2;
  meName: string;
  teams: Team[];
  activeOwnerId: string;
  jobs: Job[];
}

export const ME_ID = 'me';

export function newId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 15만 원, 15만 5,000원, 8,000원 처럼 읽기 쉽게 */
export function formatWon(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0원';
  const man = Math.floor(amount / 10000);
  const rest = amount % 10000;
  if (man === 0) return `${rest.toLocaleString('ko-KR')}원`;
  if (rest === 0) return `${man.toLocaleString('ko-KR')}만 원`;
  return `${man.toLocaleString('ko-KR')}만 ${rest.toLocaleString('ko-KR')}원`;
}

/** '150000', '15만', '150,000' 같은 입력을 원 단위 숫자로. 못 읽으면 null */
export function parseWon(input: string): number | null {
  const text = input.replace(/[,\s원]/g, '');
  if (!text) return null;
  const man = /^(\d+)만(\d*)$/.exec(text);
  if (man) return Number(man[1]) * 10000 + (man[2] ? Number(man[2]) : 0);
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return value > 0 && value <= 100_000_000 ? value : null;
}

/** 출장비가 최종 금액에 들어가는가: 방문만 했으면 들어가고, 수리했으면 '빼 드림'이 아닐 때만 들어간다 */
export function visitFeeCounts(job: Job): boolean {
  if (!job.visitFee) return false;
  if (job.outcome === 'visit_only') return true;
  return !job.visitFeeWaived;
}

/** 최종 금액 = (방문만: 출장비) / (수리: 견적 + 동의받은 추가 + 사후 청구 + 빼 주지 않는 출장비) */
export function finalAmount(job: Job): number {
  const fee = visitFeeCounts(job) ? job.visitFee ?? 0 : 0;
  if (job.outcome === 'visit_only') return fee;
  const extras = job.extras
    .filter((extra) => extra.status === 'agreed' || extra.status === 'late')
    .reduce((sum, extra) => sum + extra.amount, 0);
  return (job.estimate ?? 0) + extras + fee;
}

export function hasLateCharge(job: Job): boolean {
  return job.extras.some((extra) => extra.status === 'late');
}

export function pendingExtras(job: Job): Extra[] {
  return job.extras.filter((extra) => extra.status === 'requested');
}

export function ownerName(state: TryState, ownerId: string): string {
  if (ownerId === ME_ID) return state.meName;
  return state.teams.find((team) => team.id === ownerId)?.name ?? '알 수 없는 팀';
}

export function jobsFor(state: TryState, ownerId: string): Job[] {
  return state.jobs.filter((job) => job.ownerId === ownerId);
}

export interface ResumeStats {
  doneCount: number;
  repairedCount: number;
  visitOnlyCount: number;
  confirmedCount: number;
  asEstimatedCount: number; // 수리한 일 중 사후 청구 없이 끝낸 일
  teamCount: number;
}

/** 내 이력서 숫자: 내 이름 일 + 내가 대표인 팀 일 모두 내 경력이다 */
export function resumeStats(state: TryState): ResumeStats {
  const done = state.jobs.filter((job) => job.stage === 'done');
  const repaired = done.filter((job) => job.outcome !== 'visit_only');
  return {
    doneCount: done.length,
    repairedCount: repaired.length,
    visitOnlyCount: done.length - repaired.length,
    confirmedCount: done.filter((job) => job.customerCheck === 'confirmed').length,
    asEstimatedCount: repaired.filter((job) => !hasLateCharge(job)).length,
    teamCount: done.filter((job) => job.ownerId !== ME_ID).length,
  };
}

/* ---------- 상태 바꾸기 (모두 새 객체를 돌려준다) ---------- */

function updateJob(state: TryState, jobId: string, change: (job: Job) => Job): TryState {
  return { ...state, jobs: state.jobs.map((job) => (job.id === jobId ? change(job) : job)) };
}

function addMessage(job: Job, kind: MessageKind, now: string, extraId?: string): Job {
  return { ...job, messages: [...job.messages, { id: newId('msg'), kind, at: now, extraId }] };
}

function blankJob(now: string): Omit<Job, 'id' | 'title' | 'area' | 'customer' | 'ownerId' | 'crew' | 'source' | 'stage'> {
  return {
    symptom: '',
    wish: '',
    requestPhotos: [],
    visitAt: null,
    visitFee: null,
    visitFeeWaived: false,
    timeChangeAsked: false,
    estimate: null,
    extras: [],
    photosBefore: [],
    photosAfter: [],
    outcome: null,
    customerCheck: 'none',
    messages: [],
    createdAt: now,
  };
}

export interface NewJobInput {
  title: string;
  area: string;
  customer: string;
  ownerId: string;
  crew: string[];
}

/** 전화·현장에서 바로 받은 일: 방문 견적(현장 견적)부터 시작한다 */
export function createJob(state: TryState, input: NewJobInput, now = new Date().toISOString()): { state: TryState; jobId: string } {
  const job: Job = {
    ...blankJob(now),
    id: newId('job'),
    title: input.title.trim(),
    area: input.area.trim(),
    customer: input.customer.trim(),
    ownerId: input.ownerId,
    crew: input.crew,
    source: 'direct',
    stage: 'before',
  };
  return { state: { ...state, jobs: [job, ...state.jobs] }, jobId: job.id };
}

export interface CustomerRequestInput {
  title: string;
  area: string;
  symptom: string;
  wish: string;
  photos: string[];
}

/** 손님이 기술자님 링크로 들어와 견적을 요청한다(체험). 받는 쪽은 '나' */
export function createCustomerRequest(state: TryState, input: CustomerRequestInput, now = new Date().toISOString()): { state: TryState; jobId: string } {
  const job: Job = {
    ...blankJob(now),
    id: newId('job'),
    title: input.title.trim(),
    area: input.area.trim(),
    customer: '손님',
    ownerId: ME_ID,
    crew: [],
    source: 'link',
    symptom: input.symptom.trim(),
    wish: input.wish,
    requestPhotos: input.photos.slice(0, 3),
    stage: 'request',
  };
  return { state: { ...state, activeOwnerId: ME_ID, jobs: [job, ...state.jobs] }, jobId: job.id };
}

/** 방문 약속 보내기: 시간과 출장비(0이면 출장비 없음)를 손님이 방문 전에 본다 */
export function sendVisitPlan(
  state: TryState, jobId: string,
  plan: { visitAt: string; visitFee: number; waived: boolean },
  now = new Date().toISOString(),
): TryState {
  return updateJob(state, jobId, (job) => {
    if (job.stage !== 'request') return job;
    return addMessage({
      ...job,
      visitAt: plan.visitAt.trim(),
      visitFee: plan.visitFee > 0 ? plan.visitFee : null,
      visitFeeWaived: plan.visitFee > 0 ? plan.waived : false,
      timeChangeAsked: false,
      stage: 'scheduled',
    }, 'visit', now);
  });
}

export function addPhoto(state: TryState, jobId: string, which: 'before' | 'after', dataUrl: string): TryState {
  return updateJob(state, jobId, (job) =>
    which === 'before'
      ? { ...job, photosBefore: [...job.photosBefore, dataUrl].slice(-4) }
      : { ...job, photosAfter: [...job.photosAfter, dataUrl].slice(-4) });
}

export function removePhoto(state: TryState, jobId: string, which: 'before' | 'after', index: number): TryState {
  return updateJob(state, jobId, (job) =>
    which === 'before'
      ? { ...job, photosBefore: job.photosBefore.filter((_, i) => i !== index) }
      : { ...job, photosAfter: job.photosAfter.filter((_, i) => i !== index) });
}

/** 현장 견적 보내기: 손님이 수락해야 수리가 시작된다. 견적은 보낸 뒤 바꿀 수 없다(바꾸면 추가 요청으로) */
export function sendEstimate(state: TryState, jobId: string, estimate: number, now = new Date().toISOString()): TryState {
  return updateJob(state, jobId, (job) => {
    if (job.stage !== 'before') return job;
    return addMessage({ ...job, estimate, stage: 'quoted' }, 'estimate', now);
  });
}

export function requestExtra(state: TryState, jobId: string, amount: number, reason: string, now = new Date().toISOString()): TryState {
  return updateJob(state, jobId, (job) => {
    if (job.stage !== 'during') return job;
    const extra: Extra = { id: newId('extra'), amount, reason: reason.trim(), status: 'requested', at: now };
    return addMessage({ ...job, extras: [...job.extras, extra] }, 'extra', now, extra.id);
  });
}

/** 손님 동의 없이 붙이는 금액: 처음부터 '사후 청구'로 기록된다 */
export function addLateCharge(state: TryState, jobId: string, amount: number, reason: string, now = new Date().toISOString()): TryState {
  return updateJob(state, jobId, (job) => {
    if (job.stage !== 'during' && job.stage !== 'after') return job;
    const extra: Extra = { id: newId('extra'), amount, reason: reason.trim(), status: 'late', at: now };
    return { ...job, extras: [...job.extras, extra] };
  });
}

/** 작업 끝내기. 아직 동의받지 못한 추가 금액은 빼거나(drop) 사후 청구(late)로 남긴다 */
export function finishWork(state: TryState, jobId: string, pending: 'drop' | 'late'): TryState {
  return updateJob(state, jobId, (job) => {
    if (job.stage !== 'during') return job;
    const extras = job.extras.flatMap((extra) => {
      if (extra.status !== 'requested') return [extra];
      return pending === 'drop' ? [] : [{ ...extra, status: 'late' as const }];
    });
    return { ...job, extras, stage: 'after' };
  });
}

export function sendFinal(state: TryState, jobId: string, now = new Date().toISOString()): TryState {
  return updateJob(state, jobId, (job) => {
    if (job.stage !== 'after') return job;
    return addMessage({ ...job, stage: 'done', outcome: 'repaired', customerCheck: 'waiting', doneAt: now }, 'final', now);
  });
}

/* ---------- 손님 쪽(체험): 확인·동의만 할 수 있다 ---------- */

/** 방문 약속에 손님이 답한다. '다른 시간'이면 요청 단계로 돌아가 기술자님이 다시 정한다 */
export function customerAnswersVisit(state: TryState, jobId: string, accept: boolean): TryState {
  return updateJob(state, jobId, (job) => {
    if (job.stage !== 'scheduled') return job;
    return accept ? { ...job, stage: 'before' } : { ...job, stage: 'request', timeChangeAsked: true };
  });
}

/** 현장 견적에 손님이 답한다. 수락하면 수리 중, 아니면 '방문 견적만'으로 끝난다(출장비가 있으면 그 금액) */
export function customerAnswersEstimate(state: TryState, jobId: string, accept: boolean, now = new Date().toISOString()): TryState {
  return updateJob(state, jobId, (job) => {
    if (job.stage !== 'quoted') return job;
    if (accept) return { ...job, stage: 'during' };
    return { ...job, stage: 'done', outcome: 'visit_only', customerCheck: 'confirmed', doneAt: now };
  });
}

export function customerAnswersExtra(state: TryState, jobId: string, extraId: string, agree: boolean): TryState {
  return updateJob(state, jobId, (job) => ({
    ...job,
    extras: job.extras.map((extra) =>
      extra.id === extraId && extra.status === 'requested' ? { ...extra, status: agree ? 'agreed' : 'declined' } : extra),
  }));
}

/** '다릅니다'는 공개되지 않고 집신에만 전달된다(체험에서는 상태만 바뀐다) */
export function customerAnswersFinal(state: TryState, jobId: string, matches: boolean): TryState {
  return updateJob(state, jobId, (job) =>
    job.customerCheck === 'waiting' ? { ...job, customerCheck: matches ? 'confirmed' : 'disputed' } : job);
}

/* ---------- 처음 상태(예시 포함) ---------- */

export const EXAMPLE_TEAM_ID = 'team-example';

export function initialState(now = new Date()): TryState {
  const day = (offset: number) => new Date(now.getTime() - offset * 86_400_000).toISOString();
  const done = (id: string, offset: number): Job => ({
    ...blankJob(day(offset)),
    id,
    title: '',
    area: '',
    customer: '손님',
    ownerId: ME_ID,
    crew: [],
    source: 'link',
    stage: 'done',
    outcome: 'repaired',
    customerCheck: 'confirmed',
    doneAt: day(offset),
    isExample: true,
  });
  return {
    v: 2,
    meName: '나',
    teams: [{ id: EXAMPLE_TEAM_ID, name: '김반장 설비팀', members: ['박OO', '이OO', '최OO'] }],
    activeOwnerId: ME_ID,
    jobs: [
      {
        ...done('example-1', 9),
        title: '욕실 배관 누수 수리',
        area: '마포구',
        visitFee: 20000,
        visitFeeWaived: true,
        estimate: 150000,
        extras: [{ id: 'example-1-x', amount: 30000, reason: '배관 부속 교체', status: 'agreed', at: day(9) }],
      },
      {
        ...done('example-2', 5),
        title: '싱크대 수전 교체',
        area: '은평구',
        estimate: 80000,
        extras: [{ id: 'example-2-x', amount: 20000, reason: '배수 호스 교체', status: 'late', at: day(5) }],
      },
      {
        ...done('example-4', 4),
        title: '베란다 결로 점검',
        area: '성북구',
        visitFee: 20000,
        visitFeeWaived: true,
        estimate: 300000,
        outcome: 'visit_only',
      },
      {
        ...done('example-3', 2),
        title: '보일러 배관 교체',
        area: '노원구',
        ownerId: EXAMPLE_TEAM_ID,
        crew: ['박OO'],
        source: 'direct',
        estimate: 450000,
      },
    ],
  };
}
