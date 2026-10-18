/**
 * 로그인·회원가입·집신 계정 연결(집신체크 → 집신 저장)을 여는 스위치.
 * 2026-10-17 사용자 결정: 약관·개인정보처리방침 자문이 끝날 때까지 실서비스(zipsin.net)에서는 '준비 중'으로 닫는다.
 * 2026-10-18 수정: 닫는 곳은 실서비스뿐이다. Preview·로컬은 개발·검수를 위해 열어 둔다
 *   (Preview까지 닫혀 로그인 검수가 막혔던 실수를 바로잡음). Preview에서 일부러 닫으려면 'false'를 넣는다.
 * 실서비스에서 열 때는 Vercel Production 환경값 NEXT_PUBLIC_ACCOUNT_OPEN=true 로 바꾸고 다시 배포한다.
 */
type LaunchEnv = { NEXT_PUBLIC_ACCOUNT_OPEN?: string; NEXT_PUBLIC_VERCEL_ENV?: string };

export function isAccountOpen(
  env: LaunchEnv = { NEXT_PUBLIC_ACCOUNT_OPEN: process.env.NEXT_PUBLIC_ACCOUNT_OPEN, NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV },
): boolean {
  if (env.NEXT_PUBLIC_ACCOUNT_OPEN === 'true') return true;
  if (env.NEXT_PUBLIC_ACCOUNT_OPEN === 'false') return false;
  return env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
}

export const ACCOUNT_PREPARING_TEXT = '준비 중';
