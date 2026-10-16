/**
 * 화면에 보여 줄 아이디·이메일 가리기 (2026-10-16 사용자 승인 시안 ⑧).
 * 이메일만 알면 아이디를 볼 수 있으므로 전체를 노출하지 않는다.
 */
export function maskUsername(username: string): string {
  const value = username.trim();
  if (value.length <= 2) return `${value.slice(0, 1)}***`;
  if (value.length <= 4) return `${value.slice(0, 1)}***${value.slice(-1)}`;
  if (value.length <= 6) return `${value.slice(0, 2)}***${value.slice(-1)}`;
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.trim().split('@');
  if (!domain) return '***';
  return `${local.slice(0, Math.min(2, local.length))}****@${domain}`;
}

/** 이름 비교용: 앞뒤·중간 공백을 없애고 소문자로 맞춘다. */
export function normalizePersonName(name: string): string {
  return name.normalize('NFC').replace(/\s+/g, '').toLowerCase();
}
