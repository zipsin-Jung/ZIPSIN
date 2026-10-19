/** 집신청소 화면·서버가 함께 쓰는 고정 목록. */
export const REQUEST_CHIPS = ['아이가 살고 있어요', '화학약품은 삼가 주세요', '반려동물이 있어요', '엘리베이터가 없어요', '주차가 어려워요', '신발을 벗고 들어와 주세요'] as const;
export const MEMO_MAX = 200;
export const BLOCK_REASONS = ['쓰레기·짐 더미', '화재·그을음', '누수·물바다', '해충이 심함', '이삿짐이 아직 안 빠짐', '물·전기가 안 들어옴', '안전하지 않음', '기타'] as const;
export const SPECIAL_KINDS = ['쓰레기·짐 더미', '화재·그을음', '누수·침수 뒤', '해충 방제 뒤', '유품 정리', '기타'] as const;
export const ARRIVALS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;
export const INSPECT_QUESTIONS = [
  { id: 'hood', text: '주방 후드 안쪽을 손가락으로 쓸었을 때 미끈거리나요?' },
  { id: 'drain', text: '욕실 배수구에 머리카락이 보이나요?' },
  { id: 'rail', text: '창틀 레일을 손으로 쓸면 먼지가 묻나요?' },
] as const;
export const RECORD_SERVICES = ['입주·이사 청소', '생활 정리 청소', '특수 청소', '기타'] as const;
export const PHONE_PATTERN = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

export type BookingStatus = 'requested' | 'accepted' | 'declined' | 'cancelled' | 'working' | 'done' | 'redo' | 'block_reported' | 'completed';
export const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: '업체 수락 기다림',
  accepted: '예약 확정',
  declined: '업체가 거절함',
  cancelled: '취소됨',
  working: '청소 중',
  done: '검수해 주세요',
  redo: '다시 하는 중',
  block_reported: '시작 불가 신고 · 집신 확인 중',
  completed: '완료',
};

/**
 * 실서비스 공개 스위치. 로그인이 열려 있어야 하고(isAccountOpen),
 * 운영(production)에서는 대표 승인 뒤 Vercel 환경값 NEXT_PUBLIC_CLEAN_OPEN=true 를 켜야 열린다.
 * Preview·로컬에서는 로그인이 열려 있으면 열린다. 닫혀 있으면 준비 중 화면만.
 */
export function isCleanServiceOpen(env: { accountOpen: boolean; vercelEnv?: string; flag?: string }): boolean {
  if (!env.accountOpen) return false;
  return env.vercelEnv !== 'production' || env.flag === 'true';
}
