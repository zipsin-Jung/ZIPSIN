/**
 * cl.zipsin.net 준비 중 화면 (2026-10-18 대표 지시).
 * 신청·예약을 받는 척하지 않는다. 버튼·입력칸 없이 준비 중임만 알린다.
 */
export function CleanPreparing() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F7F3] px-5 py-12 text-[#16211E]">
      <div className="grid w-full max-w-md gap-5 rounded-[20px] border border-[#E1E6E3] bg-white p-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" aria-hidden="true" className="mx-auto h-14 w-16 object-contain" src="/images/zipsin-company-logo.jpg" />
        <div>
          <p className="text-[15px] font-semibold text-[#0B6655]">집신클린</p>
          <h1 className="mt-1 text-[24px] font-bold tracking-[-0.02em]">집신클린 서비스 준비 중이에요</h1>
        </div>
        <p className="text-base leading-7 text-[#3E4B47]">예약할 때 가격이 확정되고, 작업을 시작한 뒤에는 가격이 바뀌지 않는 청소 서비스를 준비하고 있어요.</p>
        <a className="mx-auto inline-flex min-h-12 items-center font-semibold text-[#0B6655] underline-offset-4 hover:underline" href="https://zipsin.net/">집신 둘러보기</a>
      </div>
    </main>
  );
}
