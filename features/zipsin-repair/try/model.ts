/**
 * 집신수리 체험판(2026-10-18 대표 요청: 배포 전까지 눌러볼 수 있게).
 * 실제 문자·서버 저장 없이 이 휴대폰(localStorage)에서만 움직인다. 모든 계산은 이 파일의 순수 함수로 한다.
 *
 * 원칙(기획서 '작업 기록 한 장'):
 * - 평가가 아니라 사실: 전후 사진 + 견적 + 추가(+) + 최종 금액
 * - 손님 동의 없이 붙은 금액은 '사후 청구'로 그대로 남는다
 * - 손님은 더해 줄 수만 있다: 확인/동의만 있고, 불만은 공개되지 않는다
 * - 기록은 그날의 일 한 건 단위. 누구 이름으로(나/팀) + 그날 함께한 사람
 */

export type ExtraStatus = 'requested' | 'agreed' | 'declined' | 'late';
export type JobStage = 'before' | 'during' | 'after' | 'done';
export type CustomerCheck = 'none' | 'waiting' | 'confirmed' | 'disputed';
export type MessageKind = 'estimate' | 'extra' | 'final';

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
  estimate: number | null;
  estimateSent: boolean;
  estimateSeen: boolean;
  extras: Extra[];
  photosBefore: string[];
  photosAfter: string[];
  stage: JobStage;
  customerCheck: CustomerCheck;
  messages: Message[];
  createdAt: string;
  doneAt?: string;
  isExample?: boolean;
}

export interface TryState {
  v: 1;
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

/** 최종 금액 = 견적 + 동의받은 추가 + 사후 청구. 요청 중·거절된 추가는 넣지 않는다 */
export function finalAmount(job: Job): number {
  const extras = job.extras
    .filter((extra) => extra.status === 'agreed' || extra.status === 'late')
    .reduce((sum, extra) => sum + extra.amount, 0);
  return (job.estimate ?? 0) + extras;
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
  confirmedCount: number;
  asEstimatedCount: number; // 사후 청구 없이 끝낸 작업
  teamCount: number;
}

/** 내 이력서 숫자: 내 이름 일 + 내가 대표인 팀 일 모두 내 경력이다 */
export function resumeStats(state: TryState): ResumeStats {
  const done = state.jobs.filter((job) => job.stage === 'done');
  return {
    doneCount: done.length,
    confirmedCount: done.filter((job) => job.customerCheck === 'confirmed').length,
    asEstimatedCount: done.filter((job) => !hasLateCharge(job)).length,
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

export interface NewJobInput {
  title: string;
  area: string;
  customer: string;
  ownerId: string;
  crew: string[];
}

export function createJob(state: TryState, input: NewJobInput, now = new Date().toISOString()): { state: TryState; jobId: string } {
  const job: Job = {
    id: newId('job'),
    title: input.title.trim(),
    area: input.area.trim(),
    customer: input.customer.trim(),
    ownerId: input.ownerId,
    crew: input.crew,
    estimate: null,
    estimateSent: false,
    estimateSeen: false,
    extras: [],
    photosBefore: [],
    photosAfter: [],
    stage: 'before',
    customerCheck: 'none',
    messages: [],
    createdAt: now,
  };
  return { state: { ...state, jobs: [job, ...state.jobs] }, jobId: job.id };
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

/** 수리 전: 견적을 보내면 수리 중으로 넘어간다. 견적은 보낸 뒤 바꿀 수 없다(바꾸면 추가 요청으로) */
export function sendEstimate(state: TryState, jobId: string, estimate: number, now = new Date().toISOString()): TryState {
  return updateJob(state, jobId, (job) => {
    if (job.stage !== 'before') return job;
    return addMessage({ ...job, estimate, estimateSent: true, stage: 'during' }, 'estimate', now);
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
    if (job.stage === 'done' || job.stage === 'before') return job;
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
    return addMessage({ ...job, stage: 'done', customerCheck: 'waiting', doneAt: now }, 'final', now);
  });
}

/* ---------- 손님 쪽(체험): 확인·동의만 할 수 있다 ---------- */

export function customerSeesEstimate(state: TryState, jobId: string): TryState {
  return updateJob(state, jobId, (job) => ({ ...job, estimateSeen: true }));
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
  const base = {
    estimateSent: true,
    estimateSeen: true,
    photosBefore: [],
    photosAfter: [],
    stage: 'done' as const,
    messages: [],
    isExample: true,
  };
  return {
    v: 1,
    meName: '나',
    teams: [{ id: EXAMPLE_TEAM_ID, name: '김반장 설비팀', members: ['박OO', '이OO', '최OO'] }],
    activeOwnerId: ME_ID,
    jobs: [
      {
        ...base,
        id: 'example-1',
        title: '욕실 배관 누수 수리',
        area: '마포구',
        customer: '손님',
        ownerId: ME_ID,
        crew: [],
        estimate: 150000,
        extras: [{ id: 'example-1-x', amount: 30000, reason: '배관 부속 교체', status: 'agreed', at: day(9) }],
        customerCheck: 'confirmed',
        createdAt: day(9),
        doneAt: day(9),
      },
      {
        ...base,
        id: 'example-2',
        title: '싱크대 수전 교체',
        area: '은평구',
        customer: '손님',
        ownerId: ME_ID,
        crew: [],
        estimate: 80000,
        extras: [{ id: 'example-2-x', amount: 20000, reason: '배수 호스 교체', status: 'late', at: day(5) }],
        customerCheck: 'confirmed',
        createdAt: day(5),
        doneAt: day(5),
      },
      {
        ...base,
        id: 'example-3',
        title: '보일러 배관 교체',
        area: '노원구',
        customer: '손님',
        ownerId: EXAMPLE_TEAM_ID,
        crew: ['박OO'],
        estimate: 450000,
        extras: [],
        customerCheck: 'confirmed',
        createdAt: day(2),
        doneAt: day(2),
      },
    ],
  };
}
