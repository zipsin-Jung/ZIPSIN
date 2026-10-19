import Link from 'next/link';
import { Bell } from 'lucide-react';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

const kindLabel: Record<string, string> = { chat_message: '새 대화', repair_stage: '수리', landlord_approval: '임대인 확인', inspection_sent: '입주·퇴거 상태' };

/** 알림: 나에게 온 알림만(RLS). 대화 알림은 그 대화로, 집 알림은 그 집으로. */
export default async function NotificationsPage() {
  const { supabase, user } = await requireOnboardingComplete();
  const { data } = await supabase.from('notifications').select('id, notification_kind, room_id, home_id, record_id, detail, created_at, read_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  const rows = data ?? [];
  return (
    <main className="mx-auto max-w-3xl px-4 pt-4 md:px-10 md:pt-8">
      <h1 className="text-[22px] font-bold text-[#212124] md:text-[26px]">알림</h1>
      {rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-[#EAEBEE] px-6 py-12 text-center">
          <Bell aria-hidden="true" className="size-10 text-[#9EA3AB]" strokeWidth={1.5} />
          <p className="mt-3 text-base font-semibold text-[#212124]">아직 온 알림이 없어요.</p>
          <p className="mt-1 text-[15px] text-[#6B7079]">새 대화, 수리 단계, 입주 상태 확인 요청이 오면 여기에 보여요.</p>
        </div>
      ) : (
        <ul className="mt-4">
          {rows.map((row) => {
            const href = row.notification_kind === 'chat_message' && row.room_id ? `/chats/${row.room_id}`
              : row.notification_kind === 'inspection_sent' && row.home_id ? `/homes/${row.home_id}/move-in`
              : row.record_id && row.home_id ? `/homes/${row.home_id}/repairs/${row.record_id}`
              : row.home_id ? `/homes/${row.home_id}` : '/home';
            return (
              <li className="border-b border-[#EAEBEE]" key={row.id}>
                <Link className="flex min-h-16 items-start gap-3 py-3" href={href}>
                  <span aria-hidden="true" className={`mt-2 size-2 shrink-0 rounded-full ${row.read_at ? 'bg-transparent' : 'bg-[#E5484D]'}`} />
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[15px] text-[#0B6655]">{kindLabel[row.notification_kind] ?? '알림'}</strong>
                    <span className="block text-base text-[#212124]">{row.detail ?? '새 메시지가 왔어요'}</span>
                    <span className="block text-sm text-[#6B7079]">{new Date(row.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}{row.read_at ? '' : ' · 안 읽음'}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
