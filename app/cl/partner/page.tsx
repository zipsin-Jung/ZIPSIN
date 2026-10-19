import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CleanShell } from '@/features/zipsin-clean/components/CleanShell';
import { CleanPreparing } from '@/features/zipsin-clean/components/CleanPreparing';
import { ConnectedPartner } from '@/features/zipsin-clean/components/connected';
import { listPartnerJobs } from '@/features/zipsin-clean/server/data';
import { cleanSessionDb } from '@/features/zipsin-clean/server/db';
import { cleanLinks } from '@/features/zipsin-clean/server/nav';
import { cleanOpenNow } from '@/features/zipsin-clean/server/open';
import { getCleanViewer } from '@/features/zipsin-clean/server/viewer';

export const metadata: Metadata = { title: '집신청소 · 업체', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CleanPartnerRoute() {
  if (!cleanOpenNow()) return <CleanPreparing homeHref="/" />;
  const viewer = await getCleanViewer();
  if (!viewer) redirect('/login?next=%2Fcl%2Fpartner');
  const db = await cleanSessionDb();
  let partnerName: string | null = null;
  if (viewer.partnerIds.length > 0) {
    const { data } = await db.from('clean_partners').select('name').in('id', viewer.partnerIds).eq('status', 'active').limit(1).maybeSingle();
    partnerName = (data?.name as string | undefined) ?? null;
  }
  const jobs = partnerName ? await listPartnerJobs(db) : [];
  return (
    <CleanShell links={cleanLinks(viewer, '/cl/partner')}>
      <ConnectedPartner jobs={jobs} partnerName={partnerName} />
    </CleanShell>
  );
}
