import { describe, expect, it } from 'vitest';
import { getCheckServiceHref } from '@/lib/site/check-host';

describe('getCheckServiceHref', () => {
  it('TEST-PUB-SERVICES-002 Preview·로컬에서는 같은 앱의 /ck로 보낸다', () => {
    expect(getCheckServiceHref('preview', 'https://ck.zipsin.net')).toBe('/ck');
    expect(getCheckServiceHref(undefined, 'https://ck.zipsin.net')).toBe('/ck');
  });

  it('TEST-PUB-SERVICES-003 실서비스는 집신체크 주소가 설정됐을 때만 그 주소로 보낸다', () => {
    expect(getCheckServiceHref('production', 'https://ck.zipsin.net')).toBe('https://ck.zipsin.net/');
    expect(getCheckServiceHref('production', 'https://check.example.com/x')).toBe('https://check.example.com/');
  });

  it('TEST-PUB-SERVICES-004 ck.zipsin.net 연결 전(값 없음)에는 실서비스도 /ck로 보낸다', () => {
    expect(getCheckServiceHref('production', undefined)).toBe('/ck');
    expect(getCheckServiceHref('production', '')).toBe('/ck');
  });
});
