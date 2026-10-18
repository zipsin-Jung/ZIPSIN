// cl.zipsin.net은 집신클린 주소다(DEC-031). 집신체크처럼 같은 앱·같은 계정을 쓰는 별도 서비스.
// 지금은 서비스 준비 중이라 이 주소로 들어오면 준비 중 화면만 보여 준다(2026-10-18 대표 지시).
const DEFAULT_CLEAN_SITE_URL = 'https://cl.zipsin.net';

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:(443|80)$/, '');
}

export function isCleanHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const configured = new URL(process.env.NEXT_PUBLIC_CLEAN_SITE_URL || DEFAULT_CLEAN_SITE_URL);
  return normalizeHost(host) === normalizeHost(configured.host);
}
