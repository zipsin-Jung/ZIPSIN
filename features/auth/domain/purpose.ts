import { z } from 'zod';
import type { PrimaryRole } from './profile';

export const usagePurposeSchema = z.enum(['tenant', 'landlord', 'broker', 'management_other']);
export const brokerRoleSchema = z.enum(['principal_broker', 'associate_broker', 'assistant']);

export type UsagePurpose = z.infer<typeof usagePurposeSchema>;
export type BrokerRole = z.infer<typeof brokerRoleSchema>;

export type UsageSelection = {
  usagePurpose: UsagePurpose;
  primaryRole: PrimaryRole | null;
};

export const PURPOSE_OPTIONS: ReadonlyArray<{
  id: UsagePurpose;
  label: string;
  description: string;
}> = [
  { id: 'tenant', label: '임차인', description: '계약서와 입주 상태, 수리 요청, 만기 준비를 기록해요.' },
  { id: 'landlord', label: '임대인', description: '계약과 집 상태, 수리 과정, 만기 일정을 확인해요.' },
  { id: 'broker', label: '공인중개사', description: '여러 집의 계약·사진·일정·대화를 집별로 이어가요.' },
  { id: 'management_other', label: '관리·기타', description: '초대받은 집에서 허용된 기록과 할 일을 확인해요.' },
];

export const BROKER_ROLE_OPTIONS: ReadonlyArray<{ id: BrokerRole; label: string }> = [
  { id: 'principal_broker', label: '대표 개업공인중개사' },
  { id: 'associate_broker', label: '소속공인중개사' },
  { id: 'assistant', label: '중개보조원' },
];

export function parseUsageSelection(input: { purpose: unknown; brokerRole: unknown }): UsageSelection {
  const purpose = usagePurposeSchema.parse(input.purpose);
  if (purpose === 'broker') {
    const role = brokerRoleSchema.safeParse(input.brokerRole);
    if (!role.success) throw new Error('공인중개사 세부 역할을 선택해 주세요.');
    return { usagePurpose: purpose, primaryRole: role.data };
  }
  if (input.brokerRole !== null && input.brokerRole !== undefined && input.brokerRole !== '') {
    throw new Error('선택한 사용 목적과 세부 역할이 맞지 않습니다.');
  }
  if (purpose === 'management_other') return { usagePurpose: purpose, primaryRole: null };
  return { usagePurpose: purpose, primaryRole: purpose };
}

export function isUsageRoleCompatible(purpose: UsagePurpose, role: PrimaryRole | null): boolean {
  if (purpose === 'management_other') return role === null;
  if (purpose === 'broker') return brokerRoleSchema.safeParse(role).success;
  return role === purpose;
}
