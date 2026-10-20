'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const VISITOR_KEY = 'zipsin:vid';
const SESSION_KEY = 'zipsin:sid';

function stored(storage: Storage | undefined, key: string): string | null {
  try {
    if (!storage) return null;
    let value = storage.getItem(key);
    if (!value) { value = crypto.randomUUID(); storage.setItem(key, value); }
    return value;
  } catch {
    return null;
  }
}

/**
 * 이용 통계: 어떤 화면을 봤는지만 보낸다(방문자 수·이탈 화면 계산용).
 * 이 브라우저에만 남는 무작위 번호를 쓰고, 이름·연락처와 연결하지 않는다. '추적 안 함' 설정이면 보내지 않는다.
 */
export function SiteTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || navigator.doNotTrack === '1') return;
    const payload = JSON.stringify({
      path: pathname,
      visitorId: stored(typeof localStorage === 'undefined' ? undefined : localStorage, VISITOR_KEY),
      sessionId: stored(typeof sessionStorage === 'undefined' ? undefined : sessionStorage, SESSION_KEY),
      loggedIn: /(^|;\s*)sb-[^=]+-auth-token/.test(document.cookie),
    });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon('/api/events', new Blob([payload], { type: 'text/plain' }));
      else void fetch('/api/events', { method: 'POST', body: payload, keepalive: true });
    } catch {
      // 통계 실패는 무시
    }
  }, [pathname]);
  return null;
}
