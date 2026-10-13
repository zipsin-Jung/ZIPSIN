import { describe, expect, it } from 'vitest';
import { buildLifecycleProgress, buildNextActions, formatContractDay } from '@/features/contracts/domain/lifecycle';

const homeId = '00000000-0000-4000-8000-000000000001';

describe('contract lifecycle guidance', () => {
  it('TEST-ZH-LIFE-003-I hides D-day when the expiry date is missing or invalid', () => {
    expect(formatContractDay(null, new Date('2026-10-12T15:00:00Z'))).toBeNull();
    expect(formatContractDay('not-a-date', new Date('2026-10-12T15:00:00Z'))).toBeNull();
  });

  it('TEST-ZH-LIFE-003-J formats future, today, and past calendar dates', () => {
    const today = new Date('2026-10-12T15:00:00Z');
    expect(formatContractDay('2027-02-02', today)).toEqual({ label: 'D-112', days: 112 });
    expect(formatContractDay('2026-10-13', today)).toEqual({ label: 'D-day', days: 0 });
    expect(formatContractDay('2026-10-12', today)).toEqual({ label: 'D+1', days: -1 });
  });

  it('TEST-ZH-LIFE-003-K uses the Korean calendar day at the UTC boundary', () => {
    expect(formatContractDay('2026-10-14', new Date('2026-10-13T15:30:00Z'))).toEqual({ label: 'D-day', days: 0 });
  });

  it('TEST-ZH-LIFE-004-A calculates progress only from stored facts', () => {
    expect(buildLifecycleProgress({
      hasContractDates: true,
      hasContractDocument: false,
      hasMoveInPhoto: true,
      hasManagementRecord: false,
      hasMoveOutPhoto: false,
    })).toEqual([
      { id: 'contract', label: '계약 보관', completed: false },
      { id: 'move_in', label: '입주 기록', completed: true },
      { id: 'management', label: '거주·관리', completed: false },
      { id: 'expiry', label: '만기·퇴거', completed: false },
    ]);
  });

  it('TEST-ZH-LIFE-004-B returns no more than three highest-priority missing actions', () => {
    const actions = buildNextActions({
      homeId,
      canEditContract: true,
      endsOn: null,
      planStatus: 'undecided',
      hasContractDates: false,
      hasContractDocument: false,
      hasMoveInPhoto: false,
      hasMoveOutPhoto: false,
      openTask: null,
    });
    expect(actions.map((item) => item.id)).toEqual(['contract_dates', 'contract_document', 'move_in_photo']);
    expect(actions).toHaveLength(3);
  });

  it('TEST-ZH-LIFE-004-C uses real open work and asks for a plan only near expiry', () => {
    const actions = buildNextActions({
      homeId,
      canEditContract: false,
      endsOn: '2026-12-01',
      today: new Date('2026-10-12T15:00:00Z'),
      planStatus: 'undecided',
      hasContractDates: true,
      hasContractDocument: true,
      hasMoveInPhoto: true,
      hasMoveOutPhoto: false,
      openTask: { id: 'task-1', title: '에어컨 수리 일정 확인' },
    });
    expect(actions.map((item) => item.id)).toEqual(['open_task', 'expiry_plan']);
    expect(actions[0]?.title).toBe('에어컨 수리 일정 확인');
  });

  it('TEST-ZH-LIFE-004-D changes expiry preparation by the saved plan without claiming notice', () => {
    const common = {
      homeId,
      canEditContract: false,
      endsOn: '2026-12-01',
      today: new Date('2026-10-12T15:00:00Z'),
      hasContractDates: true,
      hasContractDocument: true,
      hasMoveInPhoto: true,
      hasMoveOutPhoto: false,
      openTask: null,
    } as const;
    expect(buildNextActions({ ...common, planStatus: 'move_out_preparing' }).map((item) => item.id)).toContain('move_out_record');
    expect(buildNextActions({ ...common, planStatus: 'renewal_considering' }).map((item) => item.id)).toContain('renewal_check');
    expect(buildNextActions({ ...common, planStatus: 'undecided' }).map((item) => item.id)).toContain('expiry_plan');
  });
});
