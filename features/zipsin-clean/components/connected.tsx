'use client';

import { useRouter } from 'next/navigation';
import { AdminConsole } from '@/features/zipsin-clean/components/AdminConsole';
import { BookingFlow } from '@/features/zipsin-clean/components/BookingFlow';
import { MyCleanPage } from '@/features/zipsin-clean/components/MyCleanPage';
import { PartnerConsole } from '@/features/zipsin-clean/components/PartnerConsole';
import { uploadCleanPhotos } from '@/features/zipsin-clean/client/upload-photo';
import type { AdminBooking, AdminPartner, CustomerBooking, MyRecord, PartnerJob, PartnerOption, VisitRequest } from '@/features/zipsin-clean/domain/types';
import {
  cleanBookingAction, createCleanBooking, createCleanInvite, createCleanPartner, createCleanRecord, createCleanVisitRequest,
  deleteCleanRecord, redeemCleanInvite, setCleanPartnerStatus,
} from '@/features/zipsin-clean/server/actions';

/** 서버 페이지가 넘긴 데이터 + 서버 액션을 화면 부품에 이어 준다. */
export function ConnectedBooking({ partners, signedIn, phoneVerified }: { partners: PartnerOption[]; signedIn: boolean; phoneVerified: boolean }) {
  const router = useRouter();
  return (
    <BookingFlow
      loginHref="/login?next=%2Fcl" onBooked={() => router.push('/cl/my')} partners={partners} phoneVerified={phoneVerified}
      signedIn={signedIn} submitBooking={createCleanBooking} submitVisit={createCleanVisitRequest} verifyHref="/signup/verify?next=%2Fcl"
    />
  );
}

export function ConnectedMyPage(props: { bookings: CustomerBooking[]; records: MyRecord[]; visits: VisitRequest[] }) {
  const router = useRouter();
  return <MyCleanPage {...props} act={cleanBookingAction} addRecord={createCleanRecord} refresh={() => router.refresh()} removeRecord={deleteCleanRecord} upload={uploadCleanPhotos} />;
}

export function ConnectedPartner(props: { partnerName: string | null; jobs: PartnerJob[] }) {
  const router = useRouter();
  return <PartnerConsole {...props} act={cleanBookingAction} redeem={redeemCleanInvite} refresh={() => router.refresh()} upload={uploadCleanPhotos} />;
}

export function ConnectedAdmin(props: { partners: AdminPartner[]; bookings: AdminBooking[]; visits: VisitRequest[] }) {
  const router = useRouter();
  return <AdminConsole {...props} act={cleanBookingAction} createInvite={createCleanInvite} createPartner={createCleanPartner} refresh={() => router.refresh()} setStatus={setCleanPartnerStatus} />;
}
