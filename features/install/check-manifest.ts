import type { MetadataRoute } from 'next';

// 집신체크 installs as its own app (separate id and start screen) while sharing the 집신 account.
export const checkManifest: MetadataRoute.Manifest = {
  name: '집신체크 ZIPSIN CHECK',
  short_name: '집신체크',
  description: '보고 온 집을 체크카드로 정리하고 최대 3채까지 비교하는 집 보기 체크리스트',
  id: '/ck',
  start_url: '/ck',
  scope: '/',
  display: 'standalone',
  background_color: '#f4faf8',
  theme_color: '#173e31',
  lang: 'ko-KR',
  icons: [
    { src: '/icons/zipsin-app-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/zipsin-app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/zipsin-app-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
