import { randomUUID } from "node:crypto";
import Link from "next/link";
import { z } from "zod";
import { requireOnboardingComplete } from "@/features/auth/guards/require-onboarding";
import { AttachmentUploader } from "@/features/attachments/components/AttachmentUploader";
import { AttachmentLink } from "@/features/attachments/components/AttachmentLink";
import { ContractForm } from "@/features/contracts/components/ContractForm";
import { ContractSummary } from "@/features/contracts/components/ContractSummary";
import { NextActions } from "@/features/contracts/components/NextActions";
import { loadContractHomeSummaryFromSupabase } from "@/features/contracts/services/contract-summary";

export default async function HomeDetailPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  if (!z.uuid().safeParse(homeId).success) return <Unavailable />;
  const { supabase, user } = await requireOnboardingComplete();
  const summaryResult = await loadContractHomeSummaryFromSupabase(supabase, { homeId, userId: user.id });
  if (!summaryResult.ok) return <Unavailable />;
  const { summary } = summaryResult;
  const { data: records, error: recordsError } = await supabase
    .from("records")
    .select("id, record_kind, title, occurred_at")
    .eq("home_id", homeId)
    .order("occurred_at", { ascending: false })
    .limit(20);
  if (recordsError) return <Unavailable />;
  const { data: sharedRoom, error: sharedRoomError } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('home_id', homeId)
    .eq('room_type', 'home_shared')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (sharedRoomError) return <Unavailable />;
  const recordIds = records?.map((record) => record.id) ?? [];
  const { data: attachments, error: attachmentsError } = recordIds.length
    ? await supabase.from("attachments").select("id, record_id, original_name").in("record_id", recordIds).eq("status", "ready")
    : { data: [], error: null };
  if (attachmentsError) return <Unavailable />;
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
      <Link href="/homes" className="text-sm font-bold text-[#0b695c]">
        ← 집 목록
      </Link>
      <div className="mt-6">
        <ContractSummary summary={{
          homeLabel: summary.home.label,
          addressLine1: summary.home.addressLine1,
          addressDetail: summary.home.addressDetail,
          contractId: summary.contract?.id ?? null,
          endsOn: summary.contract?.endsOn ?? null,
          contractDay: summary.contractDay,
          ownRelationship: summary.currentUserRelationship,
          ownPlanStatus: summary.ownPlanStatus,
          partyPlans: summary.partyPlans,
        }} />
      </div>

      <div className="mt-10"><NextActions actions={summary.nextActions} /></div>

      <section className="mt-10" aria-labelledby="home-time-title">
        <p className="text-sm font-bold text-[#0b695c]">계약부터 퇴거까지</p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#102a43]" id="home-time-title">집의 시간</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.lifecycle.map((step, index) => (
            <li className={step.completed ? "rounded-2xl border border-[#9bc7c0] bg-[#edf7f4] p-5" : "rounded-2xl border border-[#dce7e4] bg-white p-5"} key={step.id}>
              <span aria-hidden="true" className="text-sm font-black text-[#0b695c]">{step.completed ? "✓" : String(index + 1).padStart(2, "0")}</span>
              <p className="mt-3 font-black text-[#102a43]">{step.label}</p>
              <p className="mt-1 text-sm text-[#607785]">{step.completed ? "기록이 준비되어 있어요" : "필요한 기록을 차례로 채워보세요"}</p>
            </li>
          ))}
        </ol>
      </section>

      {summary.canEditContract && (
        <section className="mt-10">
          <ContractForm
            contractExists={Boolean(summary.contract)}
            homeId={homeId}
            idempotencyKey={randomUUID()}
            initial={{
              contractKind: (summary.contract?.kind as "owner_occupied" | "jeonse" | "monthly_rent" | "other") ?? "jeonse",
              startsOn: summary.contract?.startsOn ?? "",
              endsOn: summary.contract?.endsOn ?? "",
            }}
          />
        </section>
      )}

      <nav aria-label="집 바로가기" className="mt-10 grid gap-3 sm:grid-cols-3">
        <Link href={`/homes/${homeId}/records/new`} className="app-primary flex min-h-14 items-center justify-center rounded-2xl px-5 text-sm font-bold text-white">새 기록 남기기</Link>
        <Link href={sharedRoom ? `/chats/${sharedRoom.id}` : "/chats"} className="app-panel flex min-h-14 items-center justify-center rounded-2xl px-5 text-sm font-bold text-[#244657]">집 대화 보기</Link>
        <Link href={`/homes/${homeId}/people`} className="app-panel flex min-h-14 items-center justify-center rounded-2xl px-5 text-sm font-bold text-[#244657]">함께하는 사람</Link>
      </nav>

      <section className="mt-10">
        <p className="text-sm font-bold text-[#0b695c]">필요할 때 다시 찾는 기록</p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#102a43]">최근 기록</h2>
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
            <Link href={`/homes/${homeId}/records/new`} className="app-primary mt-5 inline-flex min-h-12 items-center rounded-2xl px-5 text-sm font-bold text-white">첫 기록 남기기</Link>
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
