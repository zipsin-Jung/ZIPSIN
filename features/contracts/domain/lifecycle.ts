export type PlanStatus = 'undecided' | 'renewal_considering' | 'move_out_preparing';

export type ContractDay = { label: string; days: number };

function parseDateKey(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  return timestamp;
}

function koreanDateKey(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatContractDay(endsOn: string | null, now = new Date()): ContractDay | null {
  if (!endsOn) return null;
  const end = parseDateKey(endsOn);
  const today = parseDateKey(koreanDateKey(now));
  if (end === null || today === null) return null;
  const days = Math.round((end - today) / 86_400_000);
  return {
    days,
    label: days > 0 ? `D-${days}` : days < 0 ? `D+${Math.abs(days)}` : 'D-day',
  };
}

export type LifecycleFacts = {
  hasContractDates: boolean;
  hasContractDocument: boolean;
  hasMoveInPhoto: boolean;
  hasManagementRecord: boolean;
  hasMoveOutPhoto: boolean;
};

export function buildLifecycleProgress(facts: LifecycleFacts) {
  return [
    { id: 'contract' as const, label: '계약 보관', completed: facts.hasContractDates && facts.hasContractDocument },
    { id: 'move_in' as const, label: '입주 기록', completed: facts.hasMoveInPhoto },
    { id: 'management' as const, label: '거주·관리', completed: facts.hasManagementRecord },
    { id: 'expiry' as const, label: '만기·퇴거', completed: facts.hasMoveOutPhoto },
  ];
}

export type NextAction = {
  id: 'contract_dates' | 'contract_document' | 'move_in_photo' | 'open_task' | 'expiry_plan' | 'move_out_record' | 'renewal_check';
  title: string;
  description: string;
  href: string;
};

export type NextActionInput = {
  homeId: string;
  canEditContract: boolean;
  endsOn: string | null;
  today?: Date;
  planStatus: PlanStatus;
  hasContractDates: boolean;
  hasContractDocument: boolean;
  hasMoveInPhoto: boolean;
  hasMoveOutPhoto: boolean;
  openTask: { id: string; title: string } | null;
};

export function buildNextActions(input: NextActionInput): NextAction[] {
  const actions: NextAction[] = [];
  if (input.openTask) actions.push({
    id: 'open_task',
    title: input.openTask.title,
    description: '저장된 할 일의 다음 상태를 확인해 주세요.',
    href: `/homes/${input.homeId}#tasks`,
  });
  if (!input.hasContractDates && input.canEditContract) actions.push({
    id: 'contract_dates',
    title: '계약 기간 확인하기',
    description: '시작일과 만기일을 직접 확인해 저장하세요.',
    href: `/homes/${input.homeId}#contract-form`,
  });
  if (!input.hasContractDocument) actions.push({
    id: 'contract_document',
    title: '계약서 보관하기',
    description: '급할 때 찾을 수 있도록 계약서 사진이나 PDF를 남겨보세요.',
    href: `/homes/${input.homeId}/records/new?template=contract`,
  });
  if (!input.hasMoveInPhoto) actions.push({
    id: 'move_in_photo',
    title: '입주 상태 남기기',
    description: '도배·장판·시설 상태를 사진으로 남겨두세요.',
    href: `/homes/${input.homeId}/records/new?template=condition`,
  });

  const contractDay = formatContractDay(input.endsOn, input.today);
  if (contractDay && contractDay.days <= 120) {
    if (input.planStatus === 'undecided') actions.push({
      id: 'expiry_plan',
      title: '만기 뒤 계획 정하기',
      description: '계획에 맞춰 필요한 준비 순서를 보여드려요.',
      href: `/homes/${input.homeId}#expiry-plan`,
    });
    if (input.planStatus === 'move_out_preparing' && !input.hasMoveOutPhoto) actions.push({
      id: 'move_out_record',
      title: '퇴거 상태 준비하기',
      description: '입주 사진과 비교할 퇴거 상태를 준비하세요.',
      href: `/homes/${input.homeId}/records/new?template=move-out`,
    });
    if (input.planStatus === 'renewal_considering') actions.push({
      id: 'renewal_check',
      title: '연장 조건 확인하기',
      description: '상대방과 확인할 조건과 일정을 기록해 두세요.',
      href: `/homes/${input.homeId}#expiry-plan`,
    });
  }
  return actions.slice(0, 3);
}
