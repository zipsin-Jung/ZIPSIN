import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { X } from 'lucide-react';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { RecordForm, type RecordSpaceOption } from '@/features/records/components/RecordForm';

type Props = { params: Promise<{ homeId: string }>; searchParams?: Promise<{ kind?: string }> };

/**
 * 한 집에 기록하기. 고를 수 있는 칸(누가 보는지)과 종류는 DB 권한 함수(can_create_record)와 같은 기준으로만 보여 준다.
 * 화면에서 숨겨도 최종 판단은 DB가 한다.
 */
export default async function NewRecordPage({ params, searchParams }: Props) {
  const { homeId } = await params; if (!z.uuid().safeParse(homeId).success) return <Denied />;
  const query = (await searchParams) ?? {};
  const { supabase, user } = await requireOnboardingComplete();
  const { data: home } = await supabase.from('homes').select('id, office_id, home_label, address_line1, address_detail').eq('id', homeId).eq('status', 'active').maybeSingle();
  if (!home?.office_id) return <Denied />;
  const now = new Date().toISOString();
  const [{ data: membership }, { data: contract }, { data: relation }] = await Promise.all([
    supabase.from('office_memberships').select('office_role').eq('office_id', home.office_id).eq('user_id', user.id).eq('status', 'active').is('ended_at', null).lte('started_at', now).maybeSingle(),
    supabase.from('contracts').select('id').eq('home_id', homeId).eq('status', 'active').maybeSingle(),
    supabase.from('home_memberships').select('relationship_role, contract_id').eq('home_id', homeId).eq('user_id', user.id).eq('status', 'active').eq('access_scope', 'current_contract').is('ended_at', null).maybeSingle(),
  ]);
  const officeRole = membership?.office_role as string | undefined;
  const isOfficeWriter = officeRole === 'principal_broker' || officeRole === 'associate_broker';
  const isAssistant = officeRole === 'assistant';
  const isParty = Boolean(relation && contract && relation.contract_id === contract.id && ['landlord', 'tenant'].includes(relation.relationship_role));
  const spaces: RecordSpaceOption[] = [];
  if (isOfficeWriter || isAssistant) spaces.push('office_internal');
  if (contract && (isOfficeWriter || isAssistant || isParty)) spaces.push('current_contract');
  if (!spaces.length) return <Denied />;
  const label = home.home_label ?? [home.address_line1, home.address_detail].filter(Boolean).join(' ');
  return (
    <main className="mx-auto max-w-xl px-4 py-4 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#212124]">기록하기</h1>
          <p className="truncate text-[15px] text-[#4D5159]">{label}</p>
        </div>
        <Link aria-label="닫기" className="grid size-11 shrink-0 place-items-center rounded-xl text-[#212124]" href={`/homes/${homeId}`}><X aria-hidden="true" className="size-6" /></Link>
      </div>
      <RecordForm
        canNote={!isAssistant}
        canRepair={!isAssistant}
        contractId={contract?.id ?? null}
        homeId={homeId}
        idempotencyKey={randomUUID()}
        initialKind={query.kind === 'repair' ? 'repair' : 'photo'}
        officeId={spaces.includes('office_internal') ? home.office_id : null}
        spaces={spaces}
      />
    </main>
  );
}
function Denied() { return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">이 집에 기록을 남길 수 없습니다.</p><Link className="mt-5 inline-block font-semibold text-[#0B6655]" href="/homes">집 목록으로</Link></main>; }
