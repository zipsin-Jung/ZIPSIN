import Link from 'next/link';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { OfficeInviteForm } from '@/features/invitations/components/OfficeInviteForm';
import { endOfficeMemberAction } from '@/features/invitations/actions/end-office-member';
import { ConfirmEndForm } from '@/components/confirm/ConfirmEndForm';

export default async function OfficeMembersPage() {
  const { supabase, user } = await requireOnboardingComplete();
  const { data: principal } = await supabase.from('office_memberships').select('office_id, office_role')
    .eq('user_id', user.id).eq('office_role', 'principal_broker').eq('status', 'active').is('ended_at', null).lte('started_at', new Date().toISOString()).limit(1).maybeSingle();
  if (!principal) return <main className="mx-auto max-w-3xl px-5 py-16"><p role="alert">이 작업을 수행할 권한이 없습니다.</p></main>;
  const { data: members } = await supabase.from('office_memberships').select('id, user_id, office_role, status, started_at').eq('office_id', principal.office_id).eq('status', 'active').is('ended_at', null);
  return <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16"><Link href="/home" className="text-sm font-bold text-[#0B6655]">← 홈으로</Link><div className="mt-6 grid gap-8 lg:grid-cols-[1fr_420px]"><section><p className="text-sm font-bold text-[#0B6655]">사무소 업무는 개인 계정으로</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[#16211E]">구성원 관리</h1><ul className="mt-7 grid gap-3">{members?.map((member) => <li key={member.id} className="app-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"><div><strong className="text-[#16211E]">{member.office_role === 'principal_broker' ? '대표 공인중개사' : member.office_role === 'associate_broker' ? '소속공인중개사' : '중개보조원'}</strong><p className="mt-1 text-sm text-[#5D6A65]">{member.user_id === user.id ? '나 · 활성 계정' : '활성 계정'}</p></div>{member.user_id === user.id ? null : <ConfirmEndForm action={endOfficeMemberAction} fields={{ membershipId: member.id }} label="내보내기" confirmText="이 구성원을 내보낼까요? 사무소 집과 기록에 더 이상 접근할 수 없습니다. 업무 기록은 남습니다." confirmLabel="내보내기" />}</li>)}</ul></section><OfficeInviteForm officeId={principal.office_id} /></div></main>;
}
