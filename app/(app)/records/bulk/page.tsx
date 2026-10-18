import Link from 'next/link';
import { X } from 'lucide-react';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { BulkPhotoUploader, type BulkHome } from '@/features/records/components/BulkPhotoUploader';

type Props = { searchParams?: Promise<{ homeId?: string }> };
const OFFICE_ROLES = ['principal_broker', 'associate_broker', 'assistant'];

/**
 * 사진 한꺼번에 올리기 (승인 시안 ⑤-나). 사진은 '사무소 내부' 기록으로 남기므로
 * 지금 소속된 사무소의 집만 고를 수 있다. 최종 판단은 DB 권한 함수(can_create_record)가 한다.
 */
export default async function BulkPhotosPage({ searchParams }: Props) {
  const { supabase, user } = await requireOnboardingComplete();
  const query = (await searchParams) ?? {};
  const now = new Date().toISOString();
  const { data: memberships, error: membershipError } = await supabase
    .from('office_memberships').select('office_id, office_role')
    .eq('user_id', user.id).eq('status', 'active').is('ended_at', null).lte('started_at', now);
  const officeIds = (memberships ?? []).filter((item) => OFFICE_ROLES.includes(item.office_role as string)).map((item) => item.office_id as string);
  const { data: rows, error: homeError } = officeIds.length
    ? await supabase.from('homes').select('id, office_id, home_label, address_line1, address_detail').in('office_id', officeIds).eq('status', 'active').order('updated_at', { ascending: false })
    : { data: [] as Array<{ id: string; office_id: string | null; home_label: string | null; address_line1: string; address_detail: string | null }>, error: null };
  if (membershipError || homeError) return <main className="mx-auto max-w-xl px-5 py-16"><p role="alert">집 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p></main>;
  const homes: BulkHome[] = (rows ?? []).filter((row) => row.office_id).map((row) => ({
    id: row.id,
    officeId: row.office_id as string,
    label: row.home_label ?? [row.address_line1, row.address_detail].filter(Boolean).join(' '),
  }));
  const initialHomeId = z.uuid().safeParse(query.homeId).success ? (query.homeId as string) : null;
  return (
    <main className="mx-auto max-w-xl px-4 py-4 sm:py-8">
      <div className="mb-2 flex justify-end">
        <Link aria-label="닫기" className="grid size-11 place-items-center rounded-xl text-[#16211E]" href={initialHomeId ? `/homes/${initialHomeId}` : '/records'}><X aria-hidden="true" className="size-6" /></Link>
      </div>
      <BulkPhotoUploader homes={homes} initialHomeId={initialHomeId} />
    </main>
  );
}
