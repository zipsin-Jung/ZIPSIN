import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import PublicHome from '@/components/PublicHome';
import { CheckPage, checkMetadata, checkViewport } from '@/features/zipsin-check/check-page';
import { resolveRootDestination } from '@/features/navigation/root-entry';
import { isAccountOpen } from '@/lib/site/account-launch';
import { isCheckHost } from '@/lib/site/check-host';
import { subSiteForHost } from '@/lib/site/sub-sites';
import { PreparingSite, preparingMetadata } from '@/features/sub-sites/components/PreparingSite';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function onCheckHost() {
  return isCheckHost((await headers()).get('host'));
}

// ck.zipsin.net 첫 화면은 주소 끝에 '/ck'를 붙이지 않고 집신체크를 그대로 보여준다(2026-10-18 사용자 요청).
export async function generateMetadata(): Promise<Metadata> {
  const subSite = subSiteForHost((await headers()).get('host'));
  if (subSite) return preparingMetadata(subSite);
  return (await onCheckHost()) ? checkMetadata('/') : {};
}

export async function generateViewport(): Promise<Viewport> {
  return (await onCheckHost()) ? checkViewport : {};
}

export default async function Page() {
  // cl.zipsin.net(집신청소)·rp.zipsin.net(집신수리)은 준비 중 화면만(DEC-036).
  const subSite = subSiteForHost((await headers()).get('host'));
  if (subSite) return <PreparingSite homeHref="https://zipsin.net/" service={subSite} />;
  if (await onCheckHost()) return <CheckPage />;
  // 로그인이 준비 중이면 계정 확인(DB) 없이 공개 홈만 보여준다.
  if (!isAccountOpen()) return <PublicHome />;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  const destination = resolveRootDestination(Boolean(data.user));

  if (destination) {
    redirect(destination);
  }

  return <PublicHome />;
}
