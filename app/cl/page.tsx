import type { Metadata } from 'next';
import { CleanShell } from '@/features/zipsin-clean/components/CleanShell';
import { CleanPreparing } from '@/features/zipsin-clean/components/CleanPreparing';
import { ConnectedBooking } from '@/features/zipsin-clean/components/connected';
import { listPartnerOptions } from '@/features/zipsin-clean/server/data';
import { cleanSessionDb } from '@/features/zipsin-clean/server/db';
import { cleanLinks } from '@/features/zipsin-clean/server/nav';
import { cleanOpenNow } from '@/features/zipsin-clean/server/open';
import { getCleanViewer } from '@/features/zipsin-clean/server/viewer';

/** 집신청소 (cl.zipsin.net · 앱 경로 /cl). 닫혀 있으면 준비 중 화면만(공용 승인 시안). */
export const metadata: Metadata = {
  title: '집신청소 · 청소 가격 바로 보기',
  description: '사실만 고르면 가격이 하나로 나와요. 작업을 시작한 뒤에는 가격이 바뀌지 않아요.',
};
export const dynamic = 'force-dynamic';

export default async function CleanPage() {
  if (!cleanOpenNow()) return <CleanPreparing homeHref="/" />;
  const viewer = await getCleanViewer();
  const partners = viewer ? await listPartnerOptions(await cleanSessionDb()) : [];
  return (
    <CleanShell links={cleanLinks(viewer, '/cl')}>
      <ConnectedBooking partners={partners} phoneVerified={Boolean(viewer?.phoneVerified)} signedIn={Boolean(viewer)} />
    </CleanShell>
  );
}
