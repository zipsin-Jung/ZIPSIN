import { checkManifest } from '@/features/install/check-manifest';
import { isCheckHost } from '@/lib/site/check-host';

// ck.zipsin.net에서 설치하면 시작 화면도 주소 끝 '/ck' 없는 첫 화면으로 한다.
export function GET(request: Request) {
  const onCheckHost = isCheckHost(request.headers.get('host'));
  const manifest = onCheckHost ? { ...checkManifest, start_url: '/' } : checkManifest;
  return new Response(JSON.stringify(manifest), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'vary': 'host' },
  });
}
