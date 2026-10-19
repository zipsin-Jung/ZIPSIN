import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CleanShell } from '@/features/zipsin-clean/components/CleanShell';
import { CleanPreparing } from '@/features/zipsin-clean/components/CleanPreparing';
import { ConnectedMyPage } from '@/features/zipsin-clean/components/connected';
import { listCustomerBookings, listMyRecords, listMyVisitRequests } from '@/features/zipsin-clean/server/data';
import { cleanSessionDb } from '@/features/zipsin-clean/server/db';
import { cleanLinks } from '@/features/zipsin-clean/server/nav';
import { cleanOpenNow } from '@/features/zipsin-clean/server/open';
import { getCleanViewer } from '@/features/zipsin-clean/server/viewer';

export const metadata: Metadata = { title: '집신청소 · 마이페이지', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function CleanMyRoute() {
  if (!cleanOpenNow()) return <CleanPreparing homeHref="/" />;
  const viewer = await getCleanViewer();
  if (!viewer) redirect('/login?next=%2Fcl%2Fmy');
  const db = await cleanSessionDb();
  const [bookings, records, visits] = await Promise.all([listCustomerBookings(db, viewer.userId), listMyRecords(db, viewer.userId), listMyVisitRequests(db, viewer.userId)]);
  return (
    <CleanShell links={cleanLinks(viewer, '/cl/my')}>
      <ConnectedMyPage bookings={bookings} records={records} visits={visits} />
    </CleanShell>
  );
}
