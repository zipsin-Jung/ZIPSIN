import type { Metadata, Viewport } from 'next';
import ZipsinCheckApp from '@/components/zipsin-check/ZipsinCheckApp';
import { isAccountOpen } from '@/lib/site/account-launch';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/** 집신체크 화면. zipsin.net/ck 와 ck.zipsin.net(주소 끝 '/ck' 없이) 두 곳에서 같은 화면을 쓴다. */
export function checkMetadata(path: '/' | '/ck'): Metadata {
  return {
    title: '집신체크 | 로그인 없이 바로 쓰는 집 보기 체크리스트',
    description: '보고 온 집을 밝고 쉬운 체크카드로 정리하고 최대 3채까지 비교하세요.',
    alternates: { canonical: path },
    manifest: '/ck/manifest.webmanifest',
    appleWebApp: { capable: true, title: '집신체크', statusBarStyle: 'default' },
  };
}

export const checkViewport: Viewport = { themeColor: '#173e31' };

export async function CheckPage() {
  if (!isAccountOpen()) return <ZipsinCheckApp accountLabel={undefined} />;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const accountLabel = data.user?.user_metadata?.username ?? data.user?.email?.split('@')[0];
  return <ZipsinCheckApp accountLabel={accountLabel} />;
}
