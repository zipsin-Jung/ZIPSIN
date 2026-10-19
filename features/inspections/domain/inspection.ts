/**
 * 입주·퇴거 상태 기록 (v2 시안 V2MoveIn · V2Room · V2Meters · V2TenantCheck · V2MoveOut).
 * - 항목은 '확인함(이상 없음)' / '확인함(이상 있음)' / '확인 못 함' 셋 중 하나. 한 번에 모두 '이상 없음' 처리는 없다.
 * - 임차인·임대인 답은 '맞아요' / '의견'. 답하지 않은 항목은 '답 없음'이고 동의로 보지 않는다.
 * - 퇴거 비교는 나란히 보여 주기만 한다. 누가 낼지 판단하지 않는다.
 */
export type InspectionKind = 'move_in' | 'move_out';
export type ItemState = 'unchecked' | 'ok' | 'issue';
export type Aspect = 'damage' | 'cleaning';
export type ResponseKind = 'agree' | 'comment';
export type ReadingKind = 'electric' | 'gas' | 'water' | 'keys' | 'card_keys' | 'remotes' | 'door_code_changed';

export type InspectionItem = { id: string; roomId: string; label: string; aspect: Aspect; state: ItemState; note: string | null; sortOrder: number };
export type InspectionRoom = { id: string; name: string; sortOrder: number; recordId: string | null };
export type InspectionResponse = { itemId: string; userId: string; role: 'tenant' | 'landlord'; response: ResponseKind; comment: string | null };
export type InspectionReading = { kind: ReadingKind; value: string; note: string | null };
export type Inspection = { id: string; homeId: string; kind: InspectionKind; status: 'draft' | 'sent'; sentAt: string | null; createdAt: string };

export const KIND_PATH: Record<InspectionKind, string> = { move_in: 'move-in', move_out: 'move-out' };
export const KIND_LABEL: Record<InspectionKind, string> = { move_in: '입주', move_out: '퇴거' };
export const DEFAULT_ROOMS = ['거실', '안방', '작은방', '욕실', '주방', '현관', '베란다'] as const;

export const STATE_LABEL: Record<ItemState, string> = { unchecked: '확인 못 함', ok: '확인함 · 이상 없음', issue: '확인함 · 이상 있음' };

export const READINGS: ReadonlyArray<{ kind: ReadingKind; label: string; group: 'meter' | 'key'; placeholder: string }> = [
  { kind: 'electric', label: '전기', group: 'meter', placeholder: '예: 12,483 kWh' },
  { kind: 'water', label: '수도', group: 'meter', placeholder: '예: 812 ㎥' },
  { kind: 'gas', label: '가스', group: 'meter', placeholder: '예: 2,301 ㎥' },
  { kind: 'keys', label: '현관 열쇠', group: 'key', placeholder: '예: 2개' },
  { kind: 'card_keys', label: '공동현관 카드', group: 'key', placeholder: '예: 1개' },
  { kind: 'remotes', label: '리모컨', group: 'key', placeholder: '예: 에어컨 1개' },
  { kind: 'door_code_changed', label: '도어락 비밀번호', group: 'key', placeholder: '예: 입주 날 바꿈' },
];

export function roomProgress(items: InspectionItem[], roomId: string) {
  const own = items.filter((item) => item.roomId === roomId);
  const checked = own.filter((item) => item.state !== 'unchecked').length;
  const issues = own.filter((item) => item.state === 'issue').length;
  return { total: own.length, checked, issues, done: own.length > 0 && checked === own.length };
}

/** 내가 답한 것 / 답할 것. 답 없음은 동의가 아니다. */
export function responseSummary(items: InspectionItem[], responses: InspectionResponse[], userId: string) {
  const mine = new Map(responses.filter((response) => response.userId === userId).map((response) => [response.itemId, response]));
  const agreed = items.filter((item) => mine.get(item.id)?.response === 'agree').length;
  const commented = items.filter((item) => mine.get(item.id)?.response === 'comment').length;
  return { total: items.length, agreed, commented, unanswered: items.length - agreed - commented };
}

/** 퇴거 비교: 같은 방 이름 · 같은 항목 이름으로 입주 기록과 짝을 짓는다. */
export function pairWithMoveIn(moveOutItems: InspectionItem[], moveOutRooms: InspectionRoom[], moveInItems: InspectionItem[], moveInRooms: InspectionRoom[]) {
  const roomNameById = new Map(moveInRooms.map((room) => [room.id, room.name.trim()]));
  const outRoomName = new Map(moveOutRooms.map((room) => [room.id, room.name.trim()]));
  const key = (room: string | undefined, item: InspectionItem) => `${room ?? ''}::${item.aspect}::${item.label.trim()}`;
  const before = new Map(moveInItems.map((item) => [key(roomNameById.get(item.roomId), item), item]));
  return new Map(moveOutItems.map((item) => [item.id, before.get(key(outRoomName.get(item.roomId), item)) ?? null]));
}

export function inspectionErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'contract_required': return '먼저 집 화면에서 계약 기간을 등록해 주세요.';
    case 'rooms_required': return '방을 하나 이상 골라 주세요.';
    case 'note_required': return '이상 있음은 어떤 상태인지 짧게 적어 주세요.';
    case 'comment_required': return '의견 내용을 적어 주세요.';
    case 'inspection_locked': return '이미 보낸 기록이라 고칠 수 없어요.';
    case 'inspection_not_sent': return '사무소가 아직 보내지 않은 기록이에요.';
    case 'permission_denied': return '이 기록을 고칠 권한이 없어요.';
    default: return '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';
  }
}

export function knownErrorCode(message: string | undefined | null): string {
  const codes = ['contract_required', 'rooms_required', 'note_required', 'comment_required', 'inspection_locked', 'inspection_not_sent', 'permission_denied', 'too_many_rooms', 'too_many_items'];
  return codes.find((code) => message?.includes(code)) ?? 'unknown';
}
