import { headers } from 'next/headers';

/** 시도 횟수 제한용 접속 위치(원본 IP는 저장하지 않고 HMAC 키로만 쓴다). */
export async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  return requestHeaders.get('x-vercel-forwarded-for')
    ?? requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown-origin';
}
