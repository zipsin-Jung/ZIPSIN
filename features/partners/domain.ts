/** 집신 파트너 등록 (DEC-038). 지금은 사업자 공인중개사무소만 열려 있다. 수리·청소·개인은 준비 중. */
export type PartnerKind = 'broker' | 'repair' | 'cleaning';
export type DocumentKind = 'business_registration' | 'brokerage_registration' | 'broker_license';

export const OPEN_PARTNER_KINDS: PartnerKind[] = ['broker'];

export const DOCUMENTS: Record<DocumentKind, { name: string; sub: string }> = {
  business_registration: { name: '사업자등록증', sub: '사무소 이름과 대표자가 보이게' },
  brokerage_registration: { name: '중개사무소 등록증', sub: '시·군·구청에서 받은 등록증' },
  broker_license: { name: '대표 공인중개사 자격증', sub: '이름과 자격 번호가 보이게' },
};

export function requiredDocuments(kind: PartnerKind): DocumentKind[] {
  return kind === 'broker' ? ['business_registration', 'brokerage_registration', 'broker_license'] : ['business_registration'];
}

export const PARTNER_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const PARTNER_FILE_MAX = 10 * 1024 * 1024;

export function validatePartnerFile(file: { type: string; size: number }): string | null {
  if (!PARTNER_FILE_TYPES.includes(file.type as (typeof PARTNER_FILE_TYPES)[number])) return '사진(JPG·PNG)이나 PDF만 올릴 수 있어요.';
  if (file.size <= 0 || file.size > PARTNER_FILE_MAX) return '10MB 이하 파일만 올릴 수 있어요.';
  return null;
}

export const STATUS_LABEL: Record<string, string> = {
  draft: '서류 준비 중', submitted: '확인 중', approved: '승인됨', rejected: '다시 보내 주세요', withdrawn: '취소함',
};
