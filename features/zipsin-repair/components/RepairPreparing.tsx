/**
 * rp.zipsin.net 준비 중 화면 (2026-10-18 대표 승인 시안 B · 예시 기록형).
 * 신청·가입을 받는 척하지 않는다. 버튼·입력칸 없이 준비 중임과 '어떤 기록이 남는지' 예시만 보여 준다.
 * 예시 카드는 실제 기록이 아니므로 '예시'라고 분명히 적는다.
 *
 * 주의: app/globals.css의 전역 규칙(h2 42px, a color:inherit)이 Tailwind 유틸리티보다 우선하므로
 * 제목 크기와 링크 색은 style로 직접 지정한다.
 * 휴대폰에서는 오른쪽 아래 카카오톡 문의 버튼과 최종 금액이 겹치지 않도록 아래 여백을 넉넉히 둔다.
 */
const GREEN = '#0B6655';

const EXAMPLE_ROWS = [
  { label: '견적', note: '작업 전 합의', amount: '15만 원', tone: 'base' },
  { label: '+ 추가', note: '부속 교체 · 손님 동의', amount: '3만 원', tone: 'extra' },
  { label: '= 최종', note: '손님 확인됨', amount: '18만 원', tone: 'final' },
] as const;

export function RepairPreparing() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F7F7F3] px-5 pb-28 pt-10 text-[#16211E] [word-break:keep-all] md:gap-5 md:py-12">
      <div className="flex w-full max-w-md flex-col gap-4 md:max-w-[824px] md:flex-row md:items-stretch md:gap-6">
        <div className="grid w-full gap-3 rounded-[20px] border border-[#E1E6E3] bg-white p-6 text-center md:content-center md:gap-5 md:p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" aria-hidden="true" className="mx-auto h-10 w-12 object-contain md:h-14 md:w-16" src="/images/zipsin-company-logo.jpg" />
          <div>
            <p className="text-[15px] font-semibold" style={{ color: GREEN }}>집신수리</p>
            <h1 className="mt-1 text-[21px] font-bold leading-[1.35] tracking-[-0.02em] md:text-[24px]">집신수리 서비스 준비 중이에요</h1>
          </div>
          <p className="text-[15px] leading-6 text-[#3E4B47] md:text-base md:leading-7">기술자님이 남긴 전후 사진과 금액이 그대로 경력이 되는 수리 서비스를 준비하고 있어요.</p>
        </div>

        <section aria-label="수리 기록 예시" className="grid w-full gap-3 rounded-[20px] border border-[#E1E6E3] bg-white p-5 md:gap-4 md:p-6">
          <p className="text-[13px] font-semibold text-[#5B6863]">예시 · 이런 기록이 남아요</p>
          <div>
            <h2 style={{ fontSize: 18, lineHeight: 1.4, letterSpacing: '-0.01em', fontWeight: 700 }}>욕실 배관 누수 수리</h2>
            <p className="text-[13px] text-[#5B6863]">마포구 · 2026.10</p>
          </div>
          <div className="grid grid-cols-2 gap-2" aria-hidden="true">
            <div className="grid h-16 place-items-center rounded-[10px] bg-[#EEF1EC] text-[13px] text-[#4A5752] md:h-24">전 사진</div>
            <div className="grid h-16 place-items-center rounded-[10px] bg-[#E3ECE6] text-[13px] text-[#4A5752] md:h-24">후 사진</div>
          </div>
          <dl className="grid gap-2 text-[14px] md:gap-2.5 md:text-[15px]">
            {EXAMPLE_ROWS.map((row) => (
              <div
                className={`flex justify-between gap-3 ${row.tone === 'final' ? 'border-t border-[#E1E6E3] pt-2 md:pt-2.5' : ''}`}
                key={row.label}
              >
                <dt className={row.tone === 'extra' ? 'text-[#8A5A12]' : row.tone === 'final' ? 'font-bold' : 'text-[#3E4B47]'}>
                  {row.label}{' '}
                  <span
                    className={`text-[12px] md:text-[13px] ${row.tone === 'final' ? 'font-semibold' : row.tone === 'extra' ? '' : 'text-[#5B6863]'}`}
                    style={row.tone === 'final' ? { color: GREEN } : undefined}
                  >
                    {row.note}
                  </span>
                </dt>
                <dd className={row.tone === 'final' ? 'font-bold' : row.tone === 'extra' ? 'font-semibold text-[#8A5A12]' : 'font-semibold'}>
                  {row.amount}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <a className="inline-flex min-h-12 items-center font-semibold underline-offset-4 hover:underline" href="https://zipsin.net/" style={{ color: GREEN }}>집신 둘러보기</a>
    </main>
  );
}
