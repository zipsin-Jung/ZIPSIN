/**
 * 회원가입·집신 계정 연결(집신체크 → 집신 저장)을 여는 스위치.
 * 2026-10-17 사용자 결정: 약관·개인정보처리방침 자문이 끝날 때까지(약 1주) '준비 중'으로 닫고 먼저 공개한다.
 * 열 때는 Vercel 환경값 NEXT_PUBLIC_ACCOUNT_OPEN=true 로 바꾸고 다시 배포한다.
 * 값이 없거나 true가 아니면 닫힌 상태가 기본이다.
 */
export function isAccountOpen(env: Record<string, string | undefined> = { NEXT_PUBLIC_ACCOUNT_OPEN: process.env.NEXT_PUBLIC_ACCOUNT_OPEN }): boolean {
  return env.NEXT_PUBLIC_ACCOUNT_OPEN === 'true';
}

export const ACCOUNT_PREPARING_TEXT = '준비 중';
