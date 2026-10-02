import { z } from 'zod';
import type { PrimaryRole } from './profile';

const roleSchema = z.enum(['principal_broker', 'assistant', 'landlord', 'tenant']);

export const ROLE_OPTIONS: ReadonlyArray<{
  id: PrimaryRole;
  label: string;
  description: string;
  requiresInvitationNotice: string;
}> = [
  { id: 'principal_broker', label: '대표 공인중개사', description: '사무소와 집 업무를 시작합니다.', requiresInvitationNotice: '사무소 업무 권한은 별도 확인 후 사용할 수 있습니다.' },
  { id: 'assistant', label: '보조원', description: '배정받은 집과 다음 일을 확인합니다.', requiresInvitationNotice: '대표의 초대를 받아야 사무소 기록을 볼 수 있습니다.' },
  { id: 'landlord', label: '임대인', description: '소유하거나 관리하는 집의 기록을 시작합니다.', requiresInvitationNotice: '기존 집 기록 연결에는 관계 확인이 필요합니다.' },
  { id: 'tenant', label: '임차인', description: '현재 거주 중인 집의 상태를 기록합니다.', requiresInvitationNotice: '임대인 또는 사무소 초대 후 계약 공간을 볼 수 있습니다.' },
];

export function parsePrimaryRole(value: string): PrimaryRole {
  const parsed = roleSchema.safeParse(value);
  if (!parsed.success) throw new Error('올바른 역할을 선택해 주세요.');
  return parsed.data;
}
