import Link from "next/link";
import { z } from "zod";
import { requireOnboardingComplete } from "@/features/auth/guards/require-onboarding";
import { AttachmentUploader } from "@/features/attachments/components/AttachmentUploader";
import { AttachmentLink } from "@/features/attachments/components/AttachmentLink";

export default async function HomeDetailPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  if (!z.uuid().safeParse(homeId).success) return <Unavailable />;
  const { supabase } = await requireOnboardingComplete();
  const { data: home, error } = await supabase
    .from("homes")
    .select("id, office_id, home_label, address_line1, address_detail")
    .eq("id", homeId)
    .eq("status", "active")
    .maybeSingle();
  if (error || !home) return <Unavailable />;
  const { data: records } = await supabase
    .from("records")
    .select("id, record_kind, title, occurred_at")
    .eq("home_id", homeId)
    .order("occurred_at", { ascending: false })
    .limit(20);
  const { data: sharedRoom } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('home_id', homeId)
    .eq('room_type', 'home_shared')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  const recordIds = records?.map((record) => record.id) ?? [];
  const { data: attachments } = recordIds.length
    ? await supabase.from("attachments").select("id, record_id, original_name").in("record_id", recordIds).eq("status", "ready")
    : { data: [] };
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
      <Link href="/homes" className="text-sm font-bold text-[#0b695c]">
        ← 집 목록
      </Link>
      <section className="relative mt-6 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#092f3e] via-[#0a4f55] to-[#08715e] px-7 py-10 text-white shadow-[0_30px_80px_rgba(7,52,64,.2)] sm:px-10">
        <p className="text-sm font-bold text-[#9ee8d7]">비공개 집 기록</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">
          {home.home_label ?? home.address_line1}
        </h1>
        <p className="mt-4 text-[#d7eeeb]">
          {home.address_line1}
          {home.address_detail ? ` · ${home.address_detail}` : ""}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={`/homes/${homeId}/records/new`} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#0a4f55]">새 기록 남기기</Link>
          <Link href={sharedRoom ? `/chats/${sharedRoom.id}` : '/chats'} className="rounded-2xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white">집 대화 보기</Link>
          <Link href={`/homes/${homeId}/people`} className="rounded-2xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white">함께하는 사람</Link>
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-extrabold text-[#102a43]">집 타임라인</h2>
        {records?.length ? (
          <ul className="mt-5 grid gap-3">
            {records.map((record) => (
              <li key={record.id} className="app-panel rounded-2xl p-5">
                <span className="text-xs font-bold text-[#0b695c]">
                  {record.record_kind}
                </span>
                <h3 className="mt-2 font-extrabold text-[#102a43]">
                  {record.title}
                </h3>
                <time className="mt-2 block text-sm text-[#607785]">
                  {new Date(record.occurred_at).toLocaleDateString("ko-KR")}
                </time>
                <div className="mt-3 flex flex-wrap gap-3">{attachments?.filter((attachment) => attachment.record_id === record.id).map((attachment) => <AttachmentLink key={attachment.id} attachmentId={attachment.id} name={attachment.original_name} />)}</div>
                <AttachmentUploader recordId={record.id} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="app-panel mt-5 rounded-[28px] p-8 text-center">
            <p className="text-lg font-bold text-[#244657]">
              아직 남긴 기록이 없습니다.
            </p>
            <p className="mt-2 text-sm text-[#607785]">
              첫 사진이나 메모를 남기면 이 집의 시간순 기록이 시작됩니다.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Unavailable() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p role="alert">이 집을 확인할 수 없습니다.</p>
      <Link
        href="/homes"
        className="mt-5 inline-block font-bold text-[#0b695c]"
      >
        집 목록으로
      </Link>
    </main>
  );
}
