import Link from 'next/link';
import { loadAdminDashboard } from '@/features/admin/dashboard-data';
import { stepRate } from '@/features/admin/aggregate';
import { SITE_LABEL, type SiteId } from '@/lib/site/site-of';

type Props = { searchParams?: Promise<{ days?: string }> };
const RANGES = [{ days: 1, label: '오늘(24시간)' }, { days: 7, label: '7일' }, { days: 30, label: '30일' }, { days: 90, label: '90일' }];
const SITES: SiteId[] = ['zipsin', 'check', 'clean', 'repair'];
const n = (value: number | null) => (value === null ? '확인 안 됨' : value.toLocaleString('ko-KR'));

/** 총괄 대시보드: 유입 · 가입·로그인 · 저장 데이터 · 이탈을 네 서비스 한곳에서. */
export default async function AdminDashboard({ searchParams }: Props) {
  const requested = Number((await searchParams)?.days);
  const days = RANGES.some((range) => range.days === requested) ? requested : 7;
  const data = await loadAdminDashboard(days);
  const { summary } = data;
  const maxDaily = Math.max(1, ...summary.daily.map((item) => item.visitors));
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] font-bold text-[#212124]">대시보드</h1>
        <nav aria-label="기간" className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-[#EAEBEE]">
          {RANGES.map((range) => (
            <Link aria-current={range.days === days ? 'page' : undefined} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold ${range.days === days ? 'bg-[#212124] text-white' : 'text-[#4D5159]'}`} href={`/admin?days=${range.days}`} key={range.days}>{range.label}</Link>
          ))}
        </nav>
      </div>
      {!data.eventsAvailable && <p className="rounded-xl bg-[#FBF3E6] px-4 py-3 text-[15px] text-[#5B3A00]" role="status">방문 통계 표가 아직 없어요. DB 업데이트(202610200002)를 넣으면 쌓이기 시작해요.</p>}
      {data.partnersWaiting ? <Link className="rounded-xl bg-[#E3F0EC] px-4 py-3 text-[15px] font-semibold text-[#083E37]" href="/admin/partners">확인을 기다리는 파트너 신청 {data.partnersWaiting}건 →</Link> : null}

      <section aria-labelledby="sites" className="grid gap-3">
        <h2 className="text-[18px] font-bold text-[#212124]" id="sites">서비스별 유입 · 최근 {days}일</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SITES.map((site) => (
            <li className="rounded-2xl bg-white p-4 ring-1 ring-[#EAEBEE]" key={site}>
              <p className="text-[15px] font-bold text-[#212124]">{SITE_LABEL[site]}</p>
              <p className="mt-1 text-[28px] font-bold tabular-nums text-[#212124]">{n(summary.bySite[site].visitors)}<span className="ml-1 text-sm font-semibold text-[#6B7079]">방문자</span></p>
              <p className="text-sm tabular-nums text-[#4D5159]">화면 본 횟수 {n(summary.bySite[site].pageViews)} · 로그인 {n(summary.bySite[site].logins)}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-[#6B7079]">방문자 = 서로 다른 브라우저 수예요. 같은 사람이 휴대폰과 PC로 오면 2로 세요. &lsquo;추적 안 함&rsquo; 설정한 브라우저는 세지 않아요.</p>
      </section>

      <section aria-labelledby="daily" className="rounded-2xl bg-white p-5 ring-1 ring-[#EAEBEE]">
        <h2 className="text-[18px] font-bold text-[#212124]" id="daily">날짜별 방문자 (네 서비스 합계)</h2>
        {summary.daily.length ? (
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">날짜별 방문자 수</caption>
            <tbody>
              {summary.daily.map((item) => (
                <tr key={item.date}>
                  <th className="w-24 py-1 pr-3 text-left font-normal tabular-nums text-[#4D5159]" scope="row">{item.date.slice(5)}</th>
                  <td className="py-1"><span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 rounded-r-[4px] bg-[#0B6655]" style={{ width: `${Math.max(2, (item.visitors / maxDaily) * 100)}%` }} title={`${item.date} 방문자 ${item.visitors}`} /><span className="tabular-nums text-[#212124]">{item.visitors}</span></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="mt-2 text-[15px] text-[#6B7079]">이 기간에 쌓인 방문 기록이 없어요.</p>}
      </section>

      <section aria-labelledby="users" className="grid gap-3 sm:grid-cols-3">
        <h2 className="sr-only" id="users">가입</h2>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-[#EAEBEE]"><p className="text-sm text-[#4D5159]">전체 가입자</p><p className="text-[28px] font-bold tabular-nums">{n(data.users.total)}</p></div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-[#EAEBEE]"><p className="text-sm text-[#4D5159]">최근 {days}일 새 가입</p><p className="text-[28px] font-bold tabular-nums">{n(data.users.recent)}</p></div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-[#EAEBEE]"><p className="text-sm text-[#4D5159]">최근 {days}일 로그인 횟수</p><p className="text-[28px] font-bold tabular-nums">{n(SITES.reduce((sum, site) => sum + summary.bySite[site].logins, 0))}</p></div>
      </section>

      <section aria-labelledby="funnel" className="grid gap-4 lg:grid-cols-2">
        <h2 className="sr-only" id="funnel">이탈 단계</h2>
        {([['zipsin', '집신 · 어디서 빠져나가나'], ['check', '집신체크 · 어디서 빠져나가나']] as const).map(([key, title]) => {
          const steps = data.funnel[key];
          const first = steps[0].value || 0;
          return (
            <div className="rounded-2xl bg-white p-5 ring-1 ring-[#EAEBEE]" key={key}>
              <h3 className="text-[17px] font-bold text-[#212124]">{title}</h3>
              <ol className="mt-3 grid gap-2">
                {steps.map((step, index) => {
                  const rate = index ? stepRate(steps[index - 1].value, step.value) : null;
                  return (
                    <li key={step.label}>
                      <div className="flex items-baseline justify-between gap-2 text-sm"><span className="text-[#212124]">{step.label}</span><span className="tabular-nums text-[#212124]"><strong>{n(step.value)}</strong> {step.unit}{rate !== null && <span className="ml-2 text-[#6B7079]">앞 단계의 {rate}%</span>}</span></div>
                      <span aria-hidden="true" className="mt-1 block h-2.5 rounded-r-[4px] bg-[#0B6655]" style={{ width: `${first ? Math.max(2, ((step.value ?? 0) / first) * 100) : 2}%`, opacity: 1 - index * 0.12 }} />
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 text-sm text-[#6B7079]">앞 두 단계는 브라우저 수, 뒤 단계는 계정 수라 정확히 이어지지 않아요. 흐름을 보는 용도예요.</p>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="exits" className="grid gap-4 lg:grid-cols-2">
        <h2 className="sr-only" id="exits">이탈 화면</h2>
        <div className="overflow-x-auto rounded-2xl bg-white p-5 ring-1 ring-[#EAEBEE]">
          <h3 className="text-[17px] font-bold text-[#212124]">마지막으로 보고 나간 화면</h3>
          <table className="mt-3 w-full min-w-[420px] text-sm">
            <thead><tr className="text-left text-[#6B7079]"><th className="py-1 font-semibold" scope="col">서비스</th><th className="py-1 font-semibold" scope="col">화면</th><th className="py-1 text-right font-semibold" scope="col">나감</th><th className="py-1 text-right font-semibold" scope="col">한 화면만 보고 나감</th></tr></thead>
            <tbody>{summary.exits.map((row) => <tr className="border-t border-[#EAEBEE]" key={`${row.site}${row.path}`}><td className="py-1.5">{SITE_LABEL[row.site]}</td><td className="py-1.5 font-mono text-[13px]">{row.path}</td><td className="py-1.5 text-right tabular-nums">{row.exits}</td><td className="py-1.5 text-right tabular-nums">{row.bounces}</td></tr>)}</tbody>
          </table>
          {!summary.exits.length && <p className="mt-2 text-[15px] text-[#6B7079]">아직 기록이 없어요.</p>}
        </div>
        <div className="overflow-x-auto rounded-2xl bg-white p-5 ring-1 ring-[#EAEBEE]">
          <h3 className="text-[17px] font-bold text-[#212124]">많이 본 화면</h3>
          <table className="mt-3 w-full min-w-[360px] text-sm">
            <thead><tr className="text-left text-[#6B7079]"><th className="py-1 font-semibold" scope="col">서비스</th><th className="py-1 font-semibold" scope="col">화면</th><th className="py-1 text-right font-semibold" scope="col">본 횟수</th></tr></thead>
            <tbody>{summary.topPages.map((row) => <tr className="border-t border-[#EAEBEE]" key={`${row.site}${row.path}`}><td className="py-1.5">{SITE_LABEL[row.site]}</td><td className="py-1.5 font-mono text-[13px]">{row.path}</td><td className="py-1.5 text-right tabular-nums">{row.views}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="stored" className="overflow-x-auto rounded-2xl bg-white p-5 ring-1 ring-[#EAEBEE]">
        <h2 className="text-[18px] font-bold text-[#212124]" id="stored">저장된 데이터</h2>
        <table className="mt-3 w-full min-w-[420px] text-sm">
          <thead><tr className="text-left text-[#6B7079]"><th className="py-1 font-semibold" scope="col">서비스</th><th className="py-1 font-semibold" scope="col">항목</th><th className="py-1 text-right font-semibold" scope="col">전체</th><th className="py-1 text-right font-semibold" scope="col">최근 {days}일</th></tr></thead>
          <tbody>{data.data.map((row) => <tr className="border-t border-[#EAEBEE]" key={row.label}><td className="py-1.5">{SITE_LABEL[row.site as SiteId]}</td><td className="py-1.5">{row.label}</td><td className="py-1.5 text-right tabular-nums">{n(row.total)}</td><td className="py-1.5 text-right tabular-nums">{row.recent === null ? '—' : n(row.recent)}</td></tr>)}</tbody>
        </table>
        <p className="mt-3 text-sm text-[#6B7079]">개수만 보여요. 기록 내용·사진은 관리자 화면에서 열지 않아요. 집신청소·집신수리는 아직 준비 중이라 방문만 셉니다.</p>
      </section>
    </main>
  );
}
