import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '집신 ZIPSIN',
    short_name: '집신',
    description: '계약서, 사진, 대화와 일정을 집 한 채에 이어서 기록하는 주거 기록 관리 서비스',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8f6f1',
    theme_color: '#0f5c45',
    lang: 'ko-KR',
    icons: [
      {
        src: '/icons/zipsin-app-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/zipsin-app-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/zipsin-app-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
