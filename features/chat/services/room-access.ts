export type ChatRoomType = 'direct' | 'group' | 'home_shared' | 'office_internal' | 'repair_event' | 'support';

const labels: Record<ChatRoomType, string> = {
  direct: '개인 대화',
  group: '단체 대화',
  home_shared: '집 대화',
  office_internal: '사무소 대화',
  repair_event: '수리 대화',
  support: '집신 고객지원',
};

export function roomTypeLabel(type: ChatRoomType): string {
  return labels[type];
}

export function canInviteManually(type: ChatRoomType): boolean {
  return type === 'group';
}
