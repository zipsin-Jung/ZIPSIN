import { checkManifest } from '@/features/install/check-manifest';

export const dynamic = 'force-static';

export function GET() {
  return new Response(JSON.stringify(checkManifest), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8' },
  });
}
