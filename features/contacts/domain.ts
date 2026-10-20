/** 집 주소록 (2026-10-20 대표 요청). 내 주소록은 나만 본다. */
export const CONTACT_CATEGORIES = [
  { id: 'agent', label: '부동산' },
  { id: 'landlord', label: '임대인' },
  { id: 'tenant', label: '임차인' },
  { id: 'repair', label: '수리 기사님' },
  { id: 'moving', label: '이사업체' },
  { id: 'cleaning', label: '청소' },
  { id: 'management', label: '관리사무소' },
  { id: 'other', label: '기타' },
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]['id'];
export const categoryLabel = (id: string) => CONTACT_CATEGORIES.find((category) => category.id === id)?.label ?? '기타';

/** 숫자만 남겨 '010-1234-5678' 모양으로. 이상한 값은 null. */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return null;
  if (digits.length < 7 || digits.length > 12) return null;
  if (digits.startsWith('02')) return digits.length === 9 ? `02-${digits.slice(2, 5)}-${digits.slice(5)}` : digits.length === 10 ? `02-${digits.slice(2, 6)}-${digits.slice(6)}` : digits;
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}
