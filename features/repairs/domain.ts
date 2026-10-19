/** 수리 5단계 (2026-10-18 결정, migration 202610180002). 단계는 advance_repair_stage로만 바뀐다. */
export type RepairStage = 'received' | 'landlord_review' | 'scheduling' | 'completed' | 'receipt_attached';
export type RepairRole = 'office' | 'landlord' | 'tenant';

export const REPAIR_STAGES: ReadonlyArray<{ id: RepairStage; label: string; desc: string }> = [
  { id: 'received', label: '접수 중', desc: '사진과 내용을 받았어요' },
  { id: 'landlord_review', label: '임대인 확인', desc: '임대인이 수리를 확인해요' },
  { id: 'scheduling', label: '일정 조율', desc: '방문 날짜를 맞춰요' },
  { id: 'completed', label: '수리 완료', desc: '수리 후 사진을 남겨요' },
  { id: 'receipt_attached', label: '영수증 첨부', desc: '영수증까지 올리면 끝나요' },
];

export type RepairNextAction = { to: RepairStage; method: 'app' | 'phone_confirmed'; label: string; hint?: string; needsUpload?: 'photo' | 'receipt' };

/** 지금 단계에서 내가 누를 수 있는 것 (DB 규칙과 같게. 최종 판단은 DB). */
export function nextRepairActions(stage: RepairStage, role: RepairRole | null): RepairNextAction[] {
  if (!role) return [];
  switch (stage) {
    case 'received':
      return role === 'landlord' ? [] : [{ to: 'landlord_review', method: 'app', label: '임대인 확인 요청 보내기' }];
    case 'landlord_review':
      if (role === 'landlord') return [{ to: 'scheduling', method: 'app', label: '확인했어요 · 수리 진행' }];
      if (role === 'office') return [{ to: 'scheduling', method: 'phone_confirmed', label: '전화로 임대인 확인함', hint: '통화한 시각을 적어 두세요' }];
      return [];
    case 'scheduling':
      return role === 'office' ? [{ to: 'completed', method: 'app', label: '수리 완료', needsUpload: 'photo', hint: '수리 후 사진을 먼저 올려 주세요' }] : [];
    case 'completed':
      return role === 'office' ? [{ to: 'receipt_attached', method: 'app', label: '영수증 첨부 끝내기', needsUpload: 'receipt', hint: '영수증 사진이나 PDF를 먼저 올려 주세요' }] : [];
    default:
      return [];
  }
}

export const ROLE_LABEL: Record<RepairRole, string> = { office: '사무소', landlord: '임대인', tenant: '임차인' };
export const METHOD_LABEL: Record<string, string> = { app: '앱에서', phone_confirmed: '전화 확인', small_repair_skip: '작은 수리' };

export function repairErrorMessage(code?: string): string | null {
  if (!code) return null;
  if (code.includes('after_photo_required')) return '수리 후 사진을 먼저 올려 주세요.';
  if (code.includes('receipt_required')) return '영수증 사진이나 PDF를 먼저 올려 주세요.';
  if (code.includes('permission_denied')) return '이 단계는 다른 사람이 눌러야 해요.';
  if (code.includes('conflict')) return '이미 다음 단계로 넘어갔어요. 화면을 새로 고쳐 주세요.';
  return '처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
}
