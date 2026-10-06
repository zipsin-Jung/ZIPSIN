import Link from 'next/link';
import { ArrowLeft, CalendarDays, FileText, ShieldCheck, Wrench } from 'lucide-react';
import Brand, { Mascot } from '@/components/Brand';
import { UsernameLoginForm } from '@/features/auth/components/UsernameLoginForm';
import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons';
import { SUPPORTED_PROVIDERS } from '@/features/auth/domain/providers';

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorMessage = params.error
    ? '아이디 또는 비밀번호가 맞지 않습니다. 다시 확인해 주세요.'
      : null;
  const enabledProviders = SUPPORTED_PROVIDERS
    .filter((provider) => process.env[`NEXT_PUBLIC_AUTH_${provider.id.toUpperCase()}_ENABLED`] === 'true')
    .map((provider) => provider.id);

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

      <section className="mx-auto mt-5 grid max-w-[1480px] overflow-hidden rounded-[30px] border border-white/90 bg-white shadow-[0_30px_80px_-42px_rgba(20,61,46,0.35)] lg:min-h-[760px] lg:grid-cols-[1.06fr_0.94fr]">
        <div className="order-2 relative flex min-h-[570px] flex-col overflow-hidden bg-[#fbf7ec] px-7 py-10 sm:px-12 sm:py-14 lg:order-1 lg:min-h-0 lg:px-16 lg:py-16 xl:px-20">
          <div className="relative z-10 max-w-[650px]">
            <p className="mb-5 text-sm font-extrabold tracking-[0.18em] text-[#a87527]">HOME RECORD PLATFORM</p>
            <h1 className="text-[clamp(2.45rem,4.6vw,4.8rem)] font-black leading-[1.13] tracking-[-0.055em] text-[#0d4938]">
              집의 모든 기록을<br />
              <span className="text-[#c18a31]">한곳에서</span> 관리하세요
            </h1>
            <p className="mt-6 max-w-[560px] text-base leading-8 text-[#526b61] sm:text-lg">
              계약부터 수리, 사진, 일정까지<br className="hidden sm:block" /> 집마다 안전하게 이어서 관리합니다.
            </p>
          </div>

          <ul className="relative z-10 mt-9 grid max-w-md gap-3 text-base font-extrabold text-[#174b3b] sm:mt-10">
            <li className="flex min-h-16 items-center gap-4 rounded-2xl bg-white/85 px-5 shadow-sm"><FileText aria-hidden="true" className="size-7 text-[#0d5b45]" />계약·입주 기록</li>
            <li className="flex min-h-16 items-center gap-4 rounded-2xl bg-white/85 px-5 shadow-sm"><Wrench aria-hidden="true" className="size-7 text-[#0d5b45]" />수리·사진 보관</li>
            <li className="flex min-h-16 items-center gap-4 rounded-2xl bg-white/85 px-5 shadow-sm"><CalendarDays aria-hidden="true" className="size-7 text-[#0d5b45]" />일정·비용 관리</li>
          </ul>

          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-7 h-64 w-64 rounded-full bg-[#e9efdf] sm:h-80 sm:w-80 lg:-bottom-11 lg:right-2" />
          <Mascot className="absolute -bottom-7 right-0 z-10 !w-40 sm:!w-52 lg:bottom-0 lg:right-5 xl:!w-64" pose="hello" />
        </div>

        <div className="order-1 flex items-center px-6 py-12 sm:px-12 lg:order-2 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-[520px]">
            <p className="text-sm font-extrabold tracking-[0.18em] text-[#b27b25]">ZIPSIN ACCOUNT</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] text-[#0d4938] sm:text-5xl">집신 시작하기</h2>
            <p className="mb-7 mt-4 text-base leading-7 text-[#60736c]">간편 로그인 또는 아이디로 시작하세요.</p>

            <SocialLoginButtons enabledProviders={enabledProviders} next={params.next} />

            <div className="my-7 flex items-center gap-4 text-sm font-semibold text-[#6c7d76]">
              <span className="h-px flex-1 bg-[#dce4df]" />
              또는 아이디로 로그인
              <span className="h-px flex-1 bg-[#dce4df]" />
            </div>

            {errorMessage && (
              <p className="mb-6 rounded-2xl border border-[#eccdc8] bg-[#fff6f4] p-4 text-sm font-semibold leading-6 text-[#9b352d]" role="alert">
                {errorMessage}
              </p>
            )}

            <UsernameLoginForm next={params.next} />

            <div className="mt-4 text-right">
              <Link className="min-h-11 py-3 text-sm font-bold text-[#0d5b45] underline underline-offset-4" href="/account-recovery">아이디·비밀번호를 잊으셨나요?</Link>
            </div>

            <Link className="mt-3 flex min-h-14 items-center justify-center rounded-2xl border-2 border-[#0b543f] text-base font-extrabold text-[#0b543f]" href="/signup">회원가입</Link>

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
