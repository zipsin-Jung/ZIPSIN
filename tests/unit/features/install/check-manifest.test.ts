import { describe, expect, it } from 'vitest';
import { GET } from '@/app/ck/manifest.webmanifest/route';
import { checkManifest } from '@/features/install/check-manifest';
import manifest from '@/app/manifest';

describe('TEST-CK-INSTALL-005 집신체크 앱 정보', () => {
  it('집신과 다른 앱으로 설치되고 집신체크 화면에서 시작한다', () => {
    expect(checkManifest.short_name).toBe('집신체크');
    expect(checkManifest.start_url).toBe('/ck');
    expect(checkManifest.id).not.toBe(manifest().id);
    expect(checkManifest.display).toBe('standalone');
  });

  it('로그인 화면도 앱 안에서 열리도록 범위를 사이트 전체로 둔다', () => {
    expect(checkManifest.scope).toBe('/');
  });

  it('웹앱 설치 형식으로 내려준다', async () => {
    const response = GET();
    expect(response.headers.get('content-type')).toContain('application/manifest+json');
    expect(await response.json()).toMatchObject({ short_name: '집신체크' });
  });
});
