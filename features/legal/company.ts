/**
 * 약관·개인정보처리방침에 들어가는 사업자 정보. 대표가 알려 준 값만 넣는다(지어내지 않음).
 * 빈 값('')이 하나라도 있으면 문서 위에 '확인 중' 안내가 뜬다. 출시 전 모두 채운다.
 */
export const COMPANY = {
  name: '',            // 상호 (예: 집신)
  ceo: '정민선',
  businessNumber: '',  // 사업자등록번호
  address: '',         // 사업장 주소
  email: '',           // 문의·개인정보 담당 이메일
  privacyOfficer: '정민선',
  privacyOfficerTitle: '대표',
  dbRegion: '',        // Supabase 프로젝트 리전 (대시보드 Settings → General 에서 확인)
};

/** 문서 버전: 가입 때 동의 기록에 남는 값(DB 함수와 같아야 함). 시행일은 출시하는 날로 바꾼다. */
export const LEGAL_VERSION = '2026-10-02';
export const LEGAL_EFFECTIVE_DATE = '2026년 10월 ○일';

export const companyMissing = (): string[] => {
  const labels: Record<string, string> = { name: '상호', businessNumber: '사업자등록번호', address: '주소', email: '이메일', dbRegion: '데이터 저장 지역' };
  return Object.entries(labels).filter(([key]) => !COMPANY[key as keyof typeof COMPANY]).map(([, label]) => label);
};

export const show = (value: string, fallback = '확인 중') => value || fallback;
