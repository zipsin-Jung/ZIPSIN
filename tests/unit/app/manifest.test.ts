import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

describe('TEST-PWA-MANIFEST-001 집신 웹앱 manifest', () => {
  it('설치에 필요한 이름, 시작 범위, 표시 방식과 브랜드 아이콘을 제공한다', () => {
    const result = manifest();

    expect(result).toMatchObject({
      name: '집신 ZIPSIN',
      short_name: '집신',
      id: '/',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: '#0f5c45',
    });
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: '/icons/zipsin-app-192.png',
          sizes: '192x192',
          type: 'image/png',
        }),
        expect.objectContaining({
          src: '/icons/zipsin-app-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        }),
        expect.objectContaining({
          src: '/icons/zipsin-app-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        }),
      ]),
    );
  });
});
