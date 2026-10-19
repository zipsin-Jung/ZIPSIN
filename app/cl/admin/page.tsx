import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CleanShell } from '@/features/zipsin-clean/components/CleanShell';
import { CleanPreparing } from '@/features/zipsin-clean/components/CleanPreparing';
import { ConnectedAdmin } from '@/features/zipsin-clean/components/connected';
import { loadAdminData } from '@/features/zipsin-clean/server/data';
import { cleanSessionDb } from '@/features/zipsin-clean/server/db';
import { cleanLinks } from '@/features/zipsin-clean/server/nav';
import { cleanOpenNow } from '@/features/zipsin-clean/server/open';
import { getCleanViewer } from '@/features/zipsin-clean/server/viewer';

export const metadata: Metadata = { title: '집신청소 · 관리', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** 집신 운영자(clean_operators에 등록된 계정)만. 다른 사람에게는 없는 주소처럼 보인다. */
export default async function CleanAdminRoute() {
  if (!cleanOpenNow()) return <CleanPreparing homeHref="/" />;
  const viewer = await getCleanViewer();
  if (!viewer) redirect('/login?next=%2Fcl%2Fadmin');
  if (!viewer.isOperator) notFound();
  const data = await loadAdminData(await cleanSessionDb());
  return (
    <CleanShell links={cleanLinks(viewer, '/cl/admin')}>
      <ConnectedAdmin {...data} />
    </CleanShell>
  );
}
