import { describe, expect, it } from 'vitest';
import { pairWithMoveIn, responseSummary, roomProgress, knownErrorCode, type InspectionItem } from '@/features/inspections/domain/inspection';
import { nextRepairActions } from '@/features/repairs/domain';
import { monthLabel, sortHomeItems } from '@/features/home-items/domain';
import { requiredDocuments, validatePartnerFile } from '@/features/partners/domain';
import { pickSpace } from '@/features/workspace/domain/space';
import { recordTargetHref } from '@/features/records/domain/record-target';

const item = (id: string, roomId: string, label: string, state: InspectionItem['state'], aspect: InspectionItem['aspect'] = 'damage'): InspectionItem => ({ id, roomId, label, aspect, state, note: null, sortOrder: 1 });

describe('v2 입주·퇴거 상태', () => {
  it('TEST-V2-INSP-001 방 진행: 확인 못 함은 확인으로 세지 않는다', () => {
    const items = [item('a', 'r1', '벽지', 'ok'), item('b', 'r1', '바닥', 'issue'), item('c', 'r1', '천장', 'unchecked'), item('d', 'r2', '벽지', 'ok')];
    expect(roomProgress(items, 'r1')).toEqual({ total: 3, checked: 2, issues: 1, done: false });
    expect(roomProgress(items, 'r2').done).toBe(true);
  });

  it('TEST-V2-INSP-002 답 없음은 동의가 아니다', () => {
    const items = [item('a', 'r1', '벽지', 'ok'), item('b', 'r1', '바닥', 'issue'), item('c', 'r1', '천장', 'ok')];
    const responses = [
      { itemId: 'a', userId: 'me', role: 'tenant' as const, response: 'agree' as const, comment: null },
      { itemId: 'b', userId: 'me', role: 'tenant' as const, response: 'comment' as const, comment: '입주 전부터' },
      { itemId: 'c', userId: 'landlord', role: 'landlord' as const, response: 'agree' as const, comment: null },
    ];
    expect(responseSummary(items, responses, 'me')).toEqual({ total: 3, agreed: 1, commented: 1, unanswered: 1 });
  });

  it('TEST-V2-INSP-003 퇴거 비교는 같은 방·같은 항목끼리 짝짓고 없으면 null', () => {
    const inRooms = [{ id: 'in1', name: '거실', sortOrder: 1, recordId: null }];
    const outRooms = [{ id: 'out1', name: '거실 ', sortOrder: 1, recordId: null }];
    const pairs = pairWithMoveIn([item('o1', 'out1', '벽지', 'issue'), item('o2', 'out1', '새 항목', 'ok')], outRooms, [item('i1', 'in1', '벽지', 'issue')], inRooms);
    expect(pairs.get('o1')?.id).toBe('i1');
    expect(pairs.get('o2')).toBeNull();
  });

  it('TEST-V2-INSP-004 DB 오류 문구에서 아는 코드만 꺼낸다', () => {
    expect(knownErrorCode('P0001: inspection_locked')).toBe('inspection_locked');
    expect(knownErrorCode('something else')).toBe('unknown');
  });
});

describe('v2 수리 5단계', () => {
  it('TEST-V2-REPAIR-001 단계마다 누를 수 있는 사람만 버튼을 본다', () => {
    expect(nextRepairActions('received', 'tenant').map((action) => action.to)).toEqual(['landlord_review']);
    expect(nextRepairActions('received', 'landlord')).toEqual([]);
    expect(nextRepairActions('landlord_review', 'landlord')[0]).toMatchObject({ to: 'scheduling', method: 'app' });
    expect(nextRepairActions('landlord_review', 'office')[0]).toMatchObject({ method: 'phone_confirmed' });
    expect(nextRepairActions('landlord_review', 'tenant')).toEqual([]);
    expect(nextRepairActions('scheduling', 'office')[0].needsUpload).toBe('photo');
    expect(nextRepairActions('completed', 'office')[0].needsUpload).toBe('receipt');
    expect(nextRepairActions('receipt_attached', 'office')).toEqual([]);
    expect(nextRepairActions('scheduling', null)).toEqual([]);
  });
});

describe('v2 집 이력 품목', () => {
  it('TEST-V2-ITEMS-001 달까지만 보여 주고 최근에 손본 것부터', () => {
    expect(monthLabel('2025-03-01')).toBe('2025.03');
    expect(monthLabel(null)).toBeNull();
    const sorted = sortHomeItems([
      { name: '바닥', installedOn: '2022-06-01', replacedOn: null },
      { name: '보일러', installedOn: '2019-01-01', replacedOn: '2025-03-01' },
      { name: '벽지', installedOn: '2024-11-01', replacedOn: null },
    ]);
    expect(sorted.map((row) => row.name)).toEqual(['보일러', '벽지', '바닥']);
  });
});

describe('v2 파트너 등록', () => {
  it('TEST-V2-PARTNER-001 공인중개사는 서류 3가지, 다른 업체는 사업자등록증', () => {
    expect(requiredDocuments('broker')).toEqual(['business_registration', 'brokerage_registration', 'broker_license']);
    expect(requiredDocuments('cleaning')).toEqual(['business_registration']);
  });
  it('TEST-V2-PARTNER-002 사진·PDF, 10MB 이하만', () => {
    expect(validatePartnerFile({ type: 'application/pdf', size: 1000 })).toBeNull();
    expect(validatePartnerFile({ type: 'image/heic', size: 1000 })).toMatch(/JPG/);
    expect(validatePartnerFile({ type: 'image/png', size: 11 * 1024 * 1024 })).toMatch(/10MB/);
  });
});

describe('v2 한 아이디 여러 계정 (DEC-040)', () => {
  const offices = [{ id: 'o1', name: 'A', canRegisterHome: true }];
  it('TEST-V2-SPACE-001 쿠키가 내 사무소가 아니면 무시한다', () => {
    expect(pickSpace('someone-else', offices, 1)).toEqual({ kind: 'me' });
    expect(pickSpace('o1', offices, 1)).toEqual({ kind: 'office', office: offices[0] });
    expect(pickSpace('me', offices, 0)).toEqual({ kind: 'me' });
  });
  it('TEST-V2-SPACE-002 처음: 직접 연결된 집이 없고 사무소만 있으면 사무소', () => {
    expect(pickSpace(undefined, offices, 0)).toEqual({ kind: 'office', office: offices[0] });
    expect(pickSpace(undefined, [], 0)).toEqual({ kind: 'me' });
  });
  it('TEST-V2-ADD-001 기록하기 시트 종류별로 가는 곳', () => {
    expect(recordTargetHref('h', 'inspection')).toBe('/homes/h/move-in');
    expect(recordTargetHref('h', 'repair')).toBe('/homes/h/records/new?kind=repair');
    expect(recordTargetHref('h', 'evil')).toBe('/homes/h/records/new');
  });
});

import { normalizePhone } from '@/features/contacts/domain';
describe('주소록', () => {
  it('TEST-CONTACT-001 전화번호를 읽기 쉬운 모양으로, 이상한 값은 거절', () => {
    expect(normalizePhone('01012345678')).toBe('010-1234-5678');
    expect(normalizePhone('02 123 4567')).toBe('02-123-4567');
    expect(normalizePhone('021234567 8')).toBe('02-1234-5678');
    expect(normalizePhone('031-555-1234')).toBe('031-555-1234');
    expect(normalizePhone('abc')).toBeNull();
    expect(normalizePhone('12')).toBeNull();
  });
});
