import Link from 'next/link';
import { Check, ChevronLeft, Clock } from 'lucide-react';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { submitPartnerApplicationAction } from '@/features/partners/actions';
import { PartnerDocumentUpload } from '@/features/partners/components/PartnerDocumentUpload';
import { DOCUMENTS, STATUS_LABEL, requiredDocuments, type DocumentKind, type PartnerKind } from '@/features/partners/domain';

type Props = { params: Promise<{ applicationId: string }>; searchParams?: Promise<{ error?: string }> };

/** 서류 올리기 (V2PartnerDocs) → 확인 중 (V2PartnerWait). 본인 신청만 보인다(RLS). */
export default async function PartnerApplicationPage({ params, searchParams }: Props) {
  const { applicationId } = await params;
  const query = (await searchParams) ?? {};
  if (!z.uuid().safeParse(applicationId).success) return <Missing />;
  const { supabase } = await requireOnboardingComplete();
  const { data: application } = await supabase.from('partner_applications').select('id, partner_kind, business_name, status, submitted_at, review_note').eq('id', applicationId).maybeSingle();
  if (!application) return <Missing />;
  const { data: documents } = await supabase.from('partner_documents').select('document_kind, original_name, status').eq('application_id', applicationId).eq('status', 'ready');
  const ready = new Map((documents ?? []).map((document) => [document.document_kind as DocumentKind, document.original_name]));
  const required = requiredDocuments(application.partner_kind as PartnerKind);
  const allReady = required.every((kind) => ready.has(kind));

  if (application.status !== 'draft') {
    return (
      <main className="mx-auto max-w-xl px-4 pb-8 pt-3 md:py-8">
        <Back />
        <section className="mt-10 text-center">
          <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-full bg-[#F2F3F6] text-[#0B6655]"><Clock className="size-8" /></span>
          <p className="mt-4 text-[15px] font-semibold text-[#0B6655]">{application.business_name}</p>
          <h1 className="mt-1 text-[22px] font-bold text-[#212124]">{application.status === 'submitted' ? '서류를 확인하고 있어요' : STATUS_LABEL[application.status]}</h1>
          <p className="mx-auto mt-2 max-w-sm text-base leading-7 text-[#4D5159]">집신 담당자가 서류를 직접 확인해요. 결과는 이 화면에서 볼 수 있어요.</p>
          {application.review_note && <p className="mt-3 rounded-xl bg-[#F2F3F6] p-3 text-[15px] text-[#4D5159]">담당자 메모: {application.review_note}</p>}
          <Link className="app-primary mt-6 inline-flex min-h-14 items-center rounded-xl px-8 text-[17px] font-bold text-white" href="/home">홈으로</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-3 md:py-8">
      <Back />
      <h1 className="mt-1 text-[20px] font-bold text-[#212124]">공인중개사무소 등록</h1>
      <p className="mt-1 text-[15px] text-[#6B7079]">사무소 이름: {application.business_name}</p>
      {query.error && <p className="mt-3 rounded-xl bg-[#FDF3F2] px-4 py-3 text-[15px] font-semibold text-[#8C1D18]" role="alert">{query.error === 'docs' ? '필수 서류를 모두 올려 주세요.' : '보내지 못했어요. 잠시 후 다시 시도해 주세요.'}</p>}
      <h2 className="mt-5 text-[17px] font-bold text-[#212124]">필수 서류 (사진·PDF)</h2>
      <ul className="mt-1">
        {required.map((kind) => (
          <li className="flex items-start gap-3 border-b border-[#EAEBEE] py-4" key={kind}>
            <span aria-hidden="true" className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${ready.has(kind) ? 'bg-[#0B6655] text-white' : 'border-2 border-[#DCDEE3]'}`}>{ready.has(kind) && <Check className="size-4" />}</span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[17px] text-[#212124]">{DOCUMENTS[kind].name}</strong>
              <span className="block text-[15px] text-[#6B7079]">{ready.has(kind) ? `올림 · ${ready.get(kind)}` : DOCUMENTS[kind].sub}</span>
              <div className="mt-2"><PartnerDocumentUpload applicationId={applicationId} done={ready.has(kind)} kind={kind} label={DOCUMENTS[kind].name} /></div>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[15px] leading-6 text-[#4D5159]">집신 담당자가 서류를 확인해요. 확인이 끝난 뒤 서류 사진을 어떻게 보관할지는 법률 확인 뒤 정해요.</p>
      <form action={submitPartnerApplicationAction} className="mt-5">
        <input name="applicationId" type="hidden" value={applicationId} />
        <button className="app-primary min-h-14 w-full rounded-xl text-[17px] font-bold text-white disabled:opacity-45" disabled={!allReady} type="submit">확인 요청 보내기</button>
        {!allReady && <p className="mt-2 text-center text-sm text-[#6B7079]">서류 {required.length}가지를 모두 올리면 보낼 수 있어요.</p>}
      </form>
    </main>
  );
}

function Back() {
  return <Link aria-label="파트너 등록으로" className="-ml-2 grid size-11 place-items-center rounded-lg text-[#212124]" href="/partners/new"><ChevronLeft aria-hidden="true" className="size-6" /></Link>;
}

function Missing() {
  return <main className="mx-auto max-w-xl px-5 py-16"><h1 className="text-xl font-bold">신청을 찾을 수 없어요</h1><Link className="mt-3 inline-block font-semibold text-[#0B6655]" href="/partners/new">파트너 등록으로</Link></main>;
}
