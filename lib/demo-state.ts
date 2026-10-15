export type DemoRole = 'manager' | 'assistant';
export type DemoView = 'start' | 'dashboard' | 'house' | 'incident' | 'handover' | 'summary';
export type IncidentStatus = '접수' | '처리 중' | '완료';

export type DemoState = {
  role: DemoRole;
  view: DemoView;
  status: IncidentStatus;
  assignee: '박보조' | '최보조';
  notice: string;
};

export const initialDemoState: DemoState = {
  role: 'manager',
  view: 'start',
  status: '접수',
  assignee: '박보조',
  notice: '',
};

export const demoCase = {
  office: '집신 공인중개사무소',
  house: '역삼동 다가구 201호',
  incident: '욕실 누수 처리',
  schedule: '오늘 14:00 기사 방문',
  timeline: [
    ['오늘 09:10', '임대인이 광고 전 누수 확인을 요청했어요.'],
    ['오늘 10:20', '박보조가 현장을 확인하고 수리 전 사진을 남겼어요.'],
    ['오늘 11:05', '기사 방문을 오늘 14:00로 잡았어요.'],
  ],
} as const;

export function nextAction(status: IncidentStatus) {
  if (status === '접수') return '수리기사 방문 일정을 확인하세요.';
  if (status === '처리 중') return '수리 후 사진과 영수증을 확인하세요.';
  return '광고 가능 상태를 임대인에게 알려주세요.';
}

export function changeStatus(state: DemoState, status: IncidentStatus): DemoState {
  return {
    ...state,
    status,
    notice: `${status}(으)로 바뀌었습니다. 이 변화는 가상 데이터에만 반영됩니다.`,
  };
}
export function changeAssignee(state: DemoState, assignee: DemoState['assignee']): DemoState {
  if (state.role !== 'manager') {
    return {...state, notice: '담당자 변경은 대표 화면에서만 체험할 수 있습니다.'};
  }
  return {
    ...state,
    assignee,
    notice: `담당자가 ${assignee}(으)로 바뀌었습니다. 실제 계정 권한은 변경되지 않습니다.`,
  };
}
