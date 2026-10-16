import { afterEach, describe, expect, it } from 'vitest';
import { getCheckServiceHref } from '@/lib/site/check-host';

describe('getCheckServiceHref', () => {
  afterEach(() => { delete process.env.NEXT_PUBLIC_CHECK_SITE_URL; });

  it('TEST-PUB-SERVICES-002 실서비스에서는 ck.zipsin.net으로, Preview·로컬에서는 같은 앱의 /ck로 보낸다', () => {
    expect(getCheckServiceHref('production')).toBe('https://ck.zipsin.net/');
    expect(getCheckServiceHref('preview')).toBe('/ck');
    expect(getCheckServiceHref(undefined)).toBe('/ck');
  });

  it('TEST-PUB-SERVICES-003 설정된 집신체크 주소를 따른다', () => {
    process.env.NEXT_PUBLIC_CHECK_SITE_URL = 'https://check.example.com';
    expect(getCheckServiceHref('production')).toBe('https://check.example.com/');
  });
});
