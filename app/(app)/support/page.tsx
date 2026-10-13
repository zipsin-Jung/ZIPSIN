import Link from 'next/link';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { getRecentMessages } from '@/features/chat/services/message';
import { openSupportConversationAction } from '@/features/support/actions/reply-support';
import { SupportConversation } from '@/features/support/components/SupportConversation';

function KakaoSupportGuide() {
  return <aside className="mt-5 rounded-2xl border border-[#eadf9a] bg-[#fffbea] p-4 text-sm leading-6 text-[#5c5429]"><p className="font-bold text-[#3d381f]">카카오톡으로도 바로 문의할 수 있습니다.</p><p className="mt-1">카카오 문의는 집신 기록에 자동 저장되지 않습니다.</p><p className="mt-1">주민등록번호, 계좌 비밀번호, 인증번호, 실제 계약서 원본은 보내지 마세요.</p><a aria-label="집신 카카오 채널 (새 창)" className="mt-3 inline-flex min-h-11 items-center font-extrabold text-[#0b695c] underline underline-offset-4" href="https://pf.kakao.com/_xhcxkFX" target="_blank" rel="noopener noreferrer external" referrerPolicy="no-referrer">집신 카카오 채널 보기</a></aside>;
}

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ room?: string; error?: string }> }) {
  const query = await searchParams;
  const { supabase, user } = await requireOnboardingComplete();
  const { data: authorization } = await supabase.from('support_authorizations').select('id').eq('user_id', user.id).is('revoked_at', null).maybeSingle();
  const representative = Boolean(authorization);
  const requestedRoom = z.uuid().safeParse(query.room).success ? query.room! : null;
  const roomQuery = supabase.from('chat_rooms').select('id, support_status, created_by').eq('room_type', 'support').eq('status', 'active');
  const { data: room } = requestedRoom && representative ? await roomQuery.eq('id', requestedRoom).maybeSingle() : await roomQuery.eq('created_by', user.id).maybeSingle();
  if (!room) return <main className="mx-auto max-w-3xl px-5 py-14"><p className="text-sm font-bold text-[#0b695c]">공식 1:1 상담</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-0.05em]">집신 고객지원</h1><section className="app-panel mt-8 rounded-[28px] p-7 sm:p-10"><h2 className="text-2xl font-extrabold">대표에게 바로 문의하세요</h2><p className="mt-3 leading-7 text-[#607785]">초기에는 집신 대표가 직접 확인하고 답변합니다. 사람의 답변이며 AI로 표시하지 않습니다.</p><KakaoSupportGuide />{representative ? <Link href="/support/inbox" className="app-primary mt-6 inline-flex min-h-12 items-center rounded-xl px-5 font-bold text-white">고객지원 받은 문의 보기</Link> : <form action={openSupportConversationAction}><button className="app-primary mt-6 min-h-12 rounded-xl px-5 font-bold text-white">고객지원 대화 시작하기</button></form>}</section></main>;
  const messages = await getRecentMessages(supabase, room.id);
  const messageIds = messages.map((message) => message.id);
  const [{ data: attachments }, { data: membership }] = await Promise.all([
    messageIds.length ? supabase.from('chat_attachments').select('id, message_id, original_name, media_type').in('message_id', messageIds).eq('status', 'ready') : Promise.resolve({ data: [] }),
    supabase.from('chat_room_memberships').select('notifications_muted').eq('room_id', room.id).eq('user_id', user.id).eq('status', 'active').maybeSingle(),
  ]);
  return <main className="mx-auto max-w-5xl px-0 py-0 sm:px-5 sm:py-10"><div className="mb-5 flex items-end justify-between px-4 sm:px-0"><div><p className="text-sm font-bold text-[#0b695c]">공식계정 ✓</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">집신 고객지원</h1></div>{representative && <Link href="/support/inbox" className="text-sm font-bold text-[#0b695c]">문의 목록</Link>}</div><div className="px-4 sm:px-0"><KakaoSupportGuide /></div><div className="mt-5"><SupportConversation roomId={room.id} currentUserId={user.id} status={room.support_status ?? 'waiting'} representative={representative} muted={membership?.notifications_muted ?? false} messages={messages} attachments={attachments ?? []} /></div></main>;
}
