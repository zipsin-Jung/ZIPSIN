import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { acceptOfficeInvitationAction } from '@/features/invitations/actions/accept-office-invitation';
import { invitationTokenSchema } from '@/features/invitations/schemas/invitation';
import { acceptRelationshipInvitationAction } from '@/features/relationships/actions/accept-invitation';
import { workspaceErrorMessage, type WorkspaceErrorCode } from '@/features/workspace/domain/errors';

type InvitationPreview = { officeName?: string; role?: string; scope?: string; state?: string };
const allowedErrors = ['invitation_expired', 'invitation_revoked', 'invitation_used', 'conflict', 'server_error'] as const;

function asPreview(value: unknown): InvitationPreview | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as InvitationPreview : null;
}

export default async function InvitationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  const valid = invitationTokenSchema.safeParse({ token }).success;
  const { supabase } = await requireOnboardingComplete();
  const officeResult = valid ? await supabase.rpc('preview_office_invitation', { p_token: token }) : { data: null, error: null };
  const officePreview = asPreview(officeResult.data);
  const isOfficeInvitation = !officeResult.error && officePreview?.state !== undefined;
  const relationshipResult = valid && !isOfficeInvitation ? await supabase.rpc('preview_relationship_invitation', { p_token: token }) : { data: null, error: null };
  const preview = isOfficeInvitation ? officePreview : asPreview(relationshipResult.data);
  const previewError = isOfficeInvitation ? officeResult.error : relationshipResult.error;
  const stateCode = allowedErrors.find((value) => value === (error ?? preview?.state));
  const canAccept = valid && preview?.state === 'ready' && !previewError;

  if (!isOfficeInvitation && preview) {
    const roleLabel = preview.role === 'landlord' ? '임대인' : preview.role === 'tenant' ? '임차인' : preview.role === 'repairer' ? '수리기사' : null;
    const scopeLabel = preview.scope === 'current_contract' ? '현재 계약' : preview.scope === 'repair_event' ? '수리 참여' : null;
    return <main className="mx-auto max-w-2xl px-5 py-16 sm:py-24"><section className="app-panel rounded-[32px] p-8 sm:p-12"><p className="text-sm font-bold text-[#0B6655]">집 기록 초대</p><h1 aria-label={`${preview.officeName ?? '사무소'}에서 집 기록을 함께 보자고 초대했어요`} className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[#212124]">{preview.officeName ?? '사무소'}에서<br />집 기록을 함께 보자고 초대했어요</h1>{roleLabel && scopeLabel && <p className="mt-5 inline-flex rounded-full bg-[#E3F0EC] px-4 py-2 text-sm font-bold text-[#0B6655]">{roleLabel} · {scopeLabel}</p>}<p className="mt-5 leading-7 text-[#6B7079]">수락하기 전에는 집의 상세 정보가 공개되지 않습니다. 수락하면 허용된 기간과 범위 안에서만 기록을 확인할 수 있습니다.</p>{stateCode && <p role="alert" className="mt-6 font-semibold text-red-700">{workspaceErrorMessage(stateCode as WorkspaceErrorCode)}</p>}{canAccept ? <form action={acceptRelationshipInvitationAction} className="mt-8"><input type="hidden" name="token" value={token} /><button className="app-primary min-h-14 w-full rounded-2xl font-bold text-white">초대 수락하기</button></form> : !stateCode && <p role="alert" className="mt-8 font-semibold text-red-700">올바르지 않은 초대 링크입니다.</p>}</section></main>;
  }

  const roleLabel = preview?.role === 'associate_broker' ? '소속공인중개사' : preview?.role === 'assistant' ? '중개보조원' : null;
  return <main className="mx-auto max-w-2xl px-5 py-16 sm:py-24"><section className="app-panel rounded-[32px] p-8 sm:p-12"><p className="text-sm font-bold text-[#0B6655]">집신 사무소 초대</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[#212124]">{preview?.officeName ?? '사무소'}에서<br />함께 일해요</h1>{roleLabel && <p className="mt-5 inline-flex rounded-full bg-[#E3F0EC] px-4 py-2 text-sm font-bold text-[#0B6655]">초대 역할 · {roleLabel}</p>}<p className="mt-5 leading-7 text-[#6B7079]">수락하면 사무소에서 관리하는 집과 업무 기록을 함께 사용할 수 있습니다. 사무소 소속이 끝나면 접근도 바로 종료됩니다.</p>{stateCode && <p role="alert" className="mt-6 font-semibold text-red-700">{workspaceErrorMessage(stateCode as WorkspaceErrorCode)}</p>}{canAccept ? <form action={acceptOfficeInvitationAction} className="mt-8"><input type="hidden" name="token" value={token} /><button className="app-primary min-h-14 w-full rounded-2xl font-bold text-white">초대 수락하기</button></form> : !stateCode && <p role="alert" className="mt-8 font-semibold text-red-700">올바르지 않은 초대 링크입니다.</p>}</section></main>;
}
