// rp.zipsin.net은 집신수리 주소다(2026-10-18 대표 결정: repair → rp).
// 집신체크·집신클린처럼 같은 앱·같은 계정을 쓰는 별도 서비스.
// 지금은 서비스 준비 중이라 이 주소로 들어오면 준비 중 화면만 보여 준다.
const DEFAULT_REPAIR_SITE_URL = 'https://rp.zipsin.net';

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:(443|80)$/, '');
}

/**
 * 홈 상단 "집신수리" 링크 주소(2026-10-18 대표 지시).
 * rp.zipsin.net을 연결하고 NEXT_PUBLIC_REPAIR_SITE_URL을 실서비스에 넣기 전에는
 * 같은 앱의 /rp(같은 준비 중 화면)로 보낸다. 연결 안 된 주소로 가는 깨진 링크를 막는다.
 */
export function getRepairServiceHref(
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
  configuredRepairUrl: string | undefined = process.env.NEXT_PUBLIC_REPAIR_SITE_URL,
): string {
  if (vercelEnv !== 'production' || !configuredRepairUrl) return '/rp';
  return `${new URL(configuredRepairUrl).origin}/`;
}

export function isRepairHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const configured = new URL(process.env.NEXT_PUBLIC_REPAIR_SITE_URL || DEFAULT_REPAIR_SITE_URL);
  return normalizeHost(host) === normalizeHost(configured.host);
}
