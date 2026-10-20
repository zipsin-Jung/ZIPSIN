import { createUntypedAdminClient } from '@/lib/supabase/admin';
import { reviewPartnerAction } from '@/features/admin/actions';
import { DOCUMENTS, STATUS_LABEL, type DocumentKind } from '@/features/partners/domain';

type Props = { searchParams?: Promise<{ error?: string; done?: string }> };
const KIND: Record<string, string> = { broker: '공인중개사무소', repair: '수리·인테리어', cleaning: '청소' };
const errors: Record<string, string> = { input: '다시 시도해 주세요.', note: '반려할 때는 이유를 적어 주세요(신청자에게 보여요).', state: '이미 처리된 신청이에요.', save: '저장하지 못했어요.' };

/** 파트너 신청 확인: 서류를 열어 보고(5분 동안만 열리는 주소) 승인·반려. */
export default async function AdminPartnersPage({ searchParams }: Props) {
  const query = (await searchParams) ?? {};
  const admin = createUntypedAdminClient();
  const { data: applications, error } = await admin.from('partner_applications').select('id, user_id, partner_kind, business_name, status, created_at, submitted_at, review_note').in('status', ['submitted', 'approved', 'rejected']).order('submitted_at', { ascending: false }).limit(100);
  const ids = (applications ?? []).map((row) => row.id);
  const { data: documents } = ids.length ? await admin.from('partner_documents').select('application_id, document_kind, storage_path, original_name').in('application_id', ids).eq('status', 'ready') : { data: [] };
  const { data: signed } = documents?.length ? await admin.storage.from('partner-documents').createSignedUrls(documents.map((doc) => doc.storage_path), 300) : { data: [] };
  const urlByPath = new Map((signed ?? []).map((row) => [row.path, row.signedUrl]));
  const waiting = (applications ?? []).filter((row) => row.status === 'submitted');
  const done = (applications ?? []).filter((row) => row.status !== 'submitted');
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:px-8">
      <h1 className="text-[24px] font-bold text-[#212124]">파트너 승인</h1>
      {query.error && <p className="rounded-xl bg-[#FDF3F2] px-4 py-3 text-[15px] font-semibold text-[#8C1D18]" role="alert">{errors[query.error] ?? errors.save}</p>}
      {query.done && <p className="rounded-xl bg-[#E3F0EC] px-4 py-3 text-[15px] font-semibold text-[#083E37]" role="status">처리했어요.</p>}
      {error && <p className="rounded-xl bg-[#FBF3E6] px-4 py-3 text-[15px] text-[#5B3A00]">신청 표를 읽지 못했어요. DB 업데이트(202610190001)가 들어갔는지 확인해 주세요.</p>}

      <section aria-labelledby="waiting" className="grid gap-3">
        <h2 className="text-[18px] font-bold" id="waiting">확인 기다리는 신청 {waiting.length}건</h2>
        {waiting.map((row) => (
          <article className="grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-[#EAEBEE]" key={row.id}>
            <div><strong className="text-[17px]">{row.business_name}</strong> <span className="text-sm text-[#4D5159]">{KIND[row.partner_kind]} · {new Date(row.submitted_at ?? row.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</span></div>
            <ul className="grid gap-1 text-[15px]">
              {(documents ?? []).filter((doc) => doc.application_id === row.id).map((doc) => {
                const url = urlByPath.get(doc.storage_path);
                return <li key={doc.storage_path}>{DOCUMENTS[doc.document_kind as DocumentKind]?.name ?? doc.document_kind}: {url ? <a className="font-semibold text-[#0B6655] underline underline-offset-4" href={url} rel="noopener noreferrer" target="_blank">{doc.original_name} 열기</a> : '열 수 없음'}</li>;
              })}
            </ul>
            <p className="text-sm text-[#6B7079]">서류 주소는 5분 뒤 닫혀요. 사업자등록증의 상호·대표자, 등록증·자격증 이름이 같은지 확인하세요. 승인하면 이 사람에게 사무소가 생기고 &lsquo;파트너로 전환&rsquo;이 열려요.</p>
            <form action={reviewPartnerAction} className="flex flex-wrap items-end gap-2">
              <input name="id" type="hidden" value={row.id} />
              <label className="grid min-w-[240px] flex-1 gap-1 text-sm font-semibold">메모 (반려 시 필수, 신청자에게 보여요)
                <input className="min-h-11 rounded-lg border border-[#DCDEE3] px-3 text-[15px] font-normal" maxLength={300} name="note" />
              </label>
              <button className="min-h-11 rounded-lg bg-[#0B6655] px-5 text-[15px] font-bold text-white" name="decision" type="submit" value="approve">승인</button>
              <button className="min-h-11 rounded-lg border border-[#8C1D18] px-5 text-[15px] font-bold text-[#8C1D18]" name="decision" type="submit" value="reject">반려</button>
            </form>
          </article>
        ))}
        {!waiting.length && <p className="text-[15px] text-[#6B7079]">기다리는 신청이 없어요.</p>}
      </section>

      <section aria-labelledby="done" className="overflow-x-auto rounded-2xl bg-white p-5 ring-1 ring-[#EAEBEE]">
        <h2 className="text-[18px] font-bold" id="done">처리한 신청</h2>
        <table className="mt-3 w-full min-w-[480px] text-sm">
          <thead><tr className="text-left text-[#6B7079]"><th className="py-1" scope="col">상호</th><th className="py-1" scope="col">종류</th><th className="py-1" scope="col">결과</th><th className="py-1" scope="col">메모</th></tr></thead>
          <tbody>{done.map((row) => <tr className="border-t border-[#EAEBEE]" key={row.id}><td className="py-1.5">{row.business_name}</td><td className="py-1.5">{KIND[row.partner_kind]}</td><td className="py-1.5">{STATUS_LABEL[row.status]}</td><td className="py-1.5">{row.review_note ?? ''}</td></tr>)}</tbody>
        </table>
      </section>
    </main>
  );
}
