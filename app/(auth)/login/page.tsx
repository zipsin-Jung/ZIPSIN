import Link from 'next/link';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import Brand, { Mascot } from '@/components/Brand';
import { UsernameLoginForm } from '@/features/auth/components/UsernameLoginForm';

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorMessage = params.error
    ? '아이디 또는 비밀번호가 맞지 않습니다. 다시 확인해 주세요.'
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f9f3e6_0,transparent_38%),linear-gradient(145deg,#fbfcfa_0%,#f3f7f3_100%)] px-4 py-5 text-[#12362c] sm:px-7 sm:py-7 lg:px-10">
      <header className="mx-auto flex max-w-[1480px] items-center justify-between px-1 py-1 sm:px-2">
        <Link aria-label="집신 처음으로" href="/">
          <Brand />
        </Link>
        <Link className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#31584a] transition hover:bg-white/70" href="/">
          <ArrowLeft aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">집신 소개로 돌아가기</span>
          <span className="sm:hidden">돌아가기</span>
        </Link>
      </header>

      <section className="mx-auto mt-5 grid min-h-[760px] max-w-[1480px] overflow-hidden rounded-[30px] border border-white/90 bg-white shadow-[0_30px_80px_-42px_rgba(20,61,46,0.35)] lg:grid-cols-[1.06fr_0.94fr]">
        <div className="relative flex min-h-[480px] flex-col overflow-hidden bg-[#fbf7ec] px-7 py-10 sm:px-12 sm:py-14 lg:min-h-0 lg:px-16 lg:py-20 xl:px-20">
          <div className="relative z-10 max-w-[650px]">
            <p className="mb-5 text-sm font-extrabold tracking-[0.18em] text-[#a87527]">WELCOME HOME</p>
            <h1 className="text-[clamp(2.6rem,5vw,5rem)] font-black leading-[1.13] tracking-[-0.055em] text-[#0d4938]">
              집의 기록을<br />
              <span className="text-[#c18a31]">안전하게</span> 시작하세요
            </h1>
            <p className="mt-6 max-w-[560px] text-base leading-8 text-[#526b61] sm:text-lg">
              계약부터 수리까지, 소중한 집의 기록을<br className="hidden sm:block" /> 한곳에 차곡차곡 이어갑니다.
            </p>
          </div>

          <ol className="relative z-10 mt-9 grid gap-4 text-sm font-bold text-[#174b3b] sm:mt-12 sm:text-base lg:gap-5">
            {['아이디와 비밀번호 입력', '휴대전화 인증', '첫 집 등록'].map((step, index) => (
              <li className="flex items-center gap-4" key={step}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#d8b872] bg-white/80 text-[#8b641f]">{index + 1}</span>
                <span>{step}</span>
                <Check aria-hidden="true" className="ml-auto size-4 text-[#89a694]" />
              </li>
            ))}
          </ol>

          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-7 h-64 w-64 rounded-full bg-[#e9efdf] sm:h-80 sm:w-80 lg:-bottom-11 lg:right-2" />
          <Mascot className="absolute -bottom-7 right-2 z-10 !w-48 sm:!w-60 lg:bottom-0 lg:right-8 xl:!w-72" pose="hello" />
        </div>

        <div className="flex items-center px-6 py-12 sm:px-12 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-[520px]">
            <p className="text-sm font-extrabold tracking-[0.18em] text-[#b27b25]">ZIPSIN ACCOUNT</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] text-[#0d4938] sm:text-5xl">집신 시작하기</h2>
            <p className="mb-9 mt-4 text-base leading-7 text-[#60736c]">가입한 아이디와 비밀번호를 입력해 주세요.</p>

            {errorMessage && (
              <p className="mb-6 rounded-2xl border border-[#eccdc8] bg-[#fff6f4] p-4 text-sm font-semibold leading-6 text-[#9b352d]" role="alert">
                {errorMessage}
              </p>
            )}

            <UsernameLoginForm next={params.next} />

            <div className="mt-8 flex items-start gap-3 border-t border-[#e3e9e5] pt-6 text-sm leading-6 text-[#64786f]">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#3f8b63]" />
              <p>집신은 동의 없이 개인정보를 공유하지 않으며, 중요한 정보는 안전하게 보호합니다.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
