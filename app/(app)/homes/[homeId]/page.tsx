import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ChevronLeft, MessageCircle, Plus } from "lucide-react";
import { z } from "zod";
import { requireOnboardingComplete } from "@/features/auth/guards/require-onboarding";
import { ContractForm } from "@/features/contracts/components/ContractForm";
import { ContractSummary } from "@/features/contracts/components/ContractSummary";
import { NextActions } from "@/features/contracts/components/NextActions";
import { loadContractHomeSummaryFromSupabase } from "@/features/contracts/services/contract-summary";
import { HomeRecordList, type HomeRecordItem } from "@/features/records/components/HomeRecordList";
import { PhotoGallery, type GalleryAlbum } from "@/features/records/components/PhotoGallery";

type Props = { params: Promise<{ homeId: string }>; searchParams?: Promise<{ tab?: string }> };

/** 집 화면 (승인 시안 ② · ⑭). 탭: 기록 · 사진 · 관계자. 수리 탭은 수리 5단계와 함께 붙인다. */
export default async function HomeDetailPage({ params, searchParams }: Props) {
  const { homeId } = await params;
  if (!z.uuid().safeParse(homeId).success) return <Unavailable />;
  const tab = (await searchParams)?.tab === "photos" ? "photos" : "records";
  const { supabase, user } = await requireOnboardingComplete();
  const summaryResult = await loadContractHomeSummaryFromSupabase(supabase, { homeId, userId: user.id });
  if (!summaryResult.ok) return <Unavailable />;
  const { summary } = summaryResult;
  const { data: records, error: recordsError } = await supabase
    .from("records")
    .select("id, record_kind, record_space, title, occurred_at")
    .eq("home_id", homeId)
    .order("occurred_at", { ascending: false })
    .limit(50);
  if (recordsError) return <Unavailable />;
  const { data: sharedRoom, error: sharedRoomError } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("home_id", homeId)
    .eq("room_type", "home_shared")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (sharedRoomError) return <Unavailable />;
  const recordIds = records?.map((record) => record.id) ?? [];
  const { data: attachments, error: attachmentsError } = recordIds.length
    ? await supabase.from("attachments").select("id, record_id, original_name, media_type, storage_path").in("record_id", recordIds).eq("status", "ready")
    : { data: [], error: null };
  if (attachmentsError) return <Unavailable />;

  const homeName = summary.home.label;
  const items: HomeRecordItem[] = (records ?? []).map((record) => ({
    id: record.id,
    kind: record.record_kind,
    space: (record.record_space ?? "office_internal") as HomeRecordItem["space"],
    title: record.title,
    occurredAt: record.occurred_at,
    attachments: (attachments ?? []).filter((attachment) => attachment.record_id === record.id).map((attachment) => ({ id: attachment.id, name: attachment.original_name })),
  }));

  let albums: GalleryAlbum[] = [];
  if (tab === "photos") {
    const photos = (attachments ?? []).filter((attachment) => attachment.media_type?.startsWith("image/") && attachment.media_type !== "image/heic");
    const signed = photos.length ? await supabase.storage.from("home-records").createSignedUrls(photos.map((photo) => photo.storage_path), 600) : { data: [], error: null };
    const urlByPath = new Map((signed.error ? [] : signed.data ?? []).map((row) => [row.path, row.signedUrl]));
    albums = items
      .map((record) => ({
        id: record.id,
        title: record.title,
        space: record.space,
        occurredAt: record.occurredAt,
        photos: photos.filter((photo) => photo.record_id === record.id).map((photo) => ({ id: photo.id, name: photo.original_name, url: urlByPath.get(photo.storage_path) ?? null })),
      }))
      .filter((album) => album.photos.length);
  }

  const tabs = [
    { id: "records", label: "기록", href: `/homes/${homeId}` },
    { id: "photos", label: "사진", href: `/homes/${homeId}?tab=photos` },
    { id: "people", label: "관계자", href: `/homes/${homeId}/people` },
  ];
  return (
    <main className="mx-auto max-w-3xl px-4 py-3 sm:py-8">
      <div className="flex items-center gap-1">
        <Link aria-label="집 목록으로" className="-ml-2 grid size-11 place-items-center rounded-xl text-[#212124]" href="/homes"><ChevronLeft aria-hidden="true" className="size-6" /></Link>
        <span className="flex-1 truncate text-[15px] text-[#4D5159]">집 목록</span>
        <Link aria-label="집 대화 보기" className="grid size-11 place-items-center rounded-xl text-[#0B6655]" href={sharedRoom ? `/chats/${sharedRoom.id}` : "/chats"}><MessageCircle aria-hidden="true" className="size-6" /></Link>
      </div>

      <div className="mt-1">
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

      <section aria-labelledby="home-time-title" className="mt-4">
        <h2 className="sr-only" id="home-time-title">집의 시간</h2>
        <ol aria-label="계약 단계" className="flex gap-1 overflow-x-auto">
          {summary.lifecycle.map((step) => (
            <li className={`flex min-h-10 flex-1 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-sm ${step.completed ? "bg-[#E3F0EC] font-semibold text-[#083E37]" : "bg-[#F2F3F6] text-[#4D5159]"}`} key={step.id}>
              {step.completed && <span aria-hidden="true">✓</span>}{step.label}
            </li>
          ))}
        </ol>
        <p className="mt-1 text-sm text-[#6B7079]">집의 시간 · 계약부터 퇴거까지</p>
      </section>

      {summary.canEditContract && (
        <details className="mt-4 rounded-2xl border border-[#EAEBEE] bg-white px-4 py-3" open={!summary.contract}>
          <summary className="min-h-10 cursor-pointer text-base font-semibold text-[#212124]">{summary.contract ? "계약 기간 고치기" : "계약 기간 등록하기"}</summary>
          <div className="mt-3">
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
          </div>
        </details>
      )}

      {summary.nextActions.length > 0 && <div className="mt-6"><NextActions actions={summary.nextActions} /></div>}

      <nav aria-label="집 메뉴" className="sticky top-14 z-10 -mx-4 mt-6 flex border-b border-[#EAEBEE] bg-[#F2F3F6] px-4 md:top-[68px]">
        {tabs.map((item) => (
          <Link aria-current={item.id === tab ? "page" : undefined} className={`flex min-h-12 flex-1 items-center justify-center border-b-2 text-base ${item.id === tab ? "border-[#0B6655] font-bold text-[#083E37]" : "border-transparent text-[#4D5159]"}`} href={item.href} key={item.id}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="mt-4" aria-label={tab === "photos" ? "사진" : "기록"}>
        {tab === "photos" ? <PhotoGallery albums={albums} homeId={homeId} /> : <HomeRecordList homeId={homeId} homeName={homeName} records={items} />}
      </section>

      <Link className="app-primary fixed bottom-24 right-4 z-40 inline-flex min-h-14 items-center gap-2 rounded-full px-5 text-base font-bold text-white shadow-[0_6px_16px_rgba(8,62,55,.25)] md:bottom-8" href={`/homes/${homeId}/records/new`}>
        <Plus aria-hidden="true" className="size-5" />이 집에 기록하기
      </Link>
    </main>
  );
}

function Unavailable() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p role="alert">이 집을 확인할 수 없습니다.</p>
      <Link href="/homes" className="mt-5 inline-block font-bold text-[#0B6655]">
        집 목록으로
      </Link>
    </main>
  );
}
