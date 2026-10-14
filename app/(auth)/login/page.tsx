import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, UserPlus } from 'lucide-react';
import Brand from '@/components/Brand';
import { UsernameLoginForm } from '@/features/auth/components/UsernameLoginForm';
import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons';
import { SUPPORTED_PROVIDERS } from '@/features/auth/domain/providers';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = sanitizeNextPath(params.next);
  const signupHref = params.next ? `/signup?next=${encodeURIComponent(next)}` : '/signup';
  const errorMessages: Record<string, string> = {
    invalid_credentials: '아이디 또는 비밀번호가 맞지 않습니다. 다시 확인해 주세요.',
    account_unavailable: '이메일 확인을 완료한 뒤 다시 로그인해 주세요.',
    rate_limited: '로그인 시도가 많아 잠시 제한됐습니다. 1분 후 다시 시도해 주세요.',
    service_unavailable: '로그인 서비스 연결을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.',
    recovery_expired: '비밀번호 재설정 링크가 만료됐습니다. 새 링크를 요청해 주세요.',
    oauth_missing_code: '간편 로그인이 취소되었거나 완료되지 않았습니다.',
    oauth_exchange_failed: '간편 로그인 연결을 완료하지 못했습니다. 다시 시도해 주세요.',
  };
  const errorMessage = params.error ? (errorMessages[params.error] ?? errorMessages.invalid_credentials) : null;
  const enabledProviders = SUPPORTED_PROVIDERS
    .filter((provider) => process.env[`NEXT_PUBLIC_AUTH_${provider.id.toUpperCase()}_ENABLED`] === 'true')
    .map((provider) => provider.id);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f9f3e6_0,transparent_38%),linear-gradient(145deg,#fbfcfa_0%,#f3f7f3_100%)] px-4 py-5 text-[#12362c] sm:px-7 sm:py-7 lg:px-10">
      <header className="mx-auto flex max-w-[1480px] items-center justify-between px-1 py-1 sm:px-2">
        <Link aria-label="집신 로그인" href="/login">
          <Brand />
        </Link>
        <Link className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#31584a] transition hover:bg-white/70" href={signupHref}>
          <UserPlus aria-hidden="true" className="size-4" />
          <span>회원가입</span>
        </Link>
      </header>

      <section className="mx-auto mt-5 grid max-w-[1480px] overflow-hidden rounded-[30px] border border-white/90 bg-white shadow-[0_30px_80px_-42px_rgba(20,61,46,0.35)] lg:min-h-[760px] lg:grid-cols-[1.06fr_0.94fr]">
        <div className="order-2 relative hidden min-h-[570px] overflow-hidden bg-[#fbf7ec] min-[391px]:flex lg:order-1 lg:min-h-0">
          <Image alt="집별 계약·사진·수리·일정 기록이 이어지는 집신 화면 예시" className="object-contain p-6 sm:p-10" fill priority sizes="(min-width: 1024px) 53vw, 100vw" src="/images/auth/zipsin-record-visual.png" />
        </div>

        <div className="order-1 flex items-center px-6 py-12 sm:px-12 lg:order-2 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-[520px]">
            <p className="text-sm font-extrabold tracking-[0.18em] text-[#b27b25]">ZIPSIN ACCOUNT</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] text-[#0d4938] sm:text-5xl">집신 시작하기</h2>
            <p className="mb-7 mt-4 text-base leading-7 text-[#60736c]">간편 로그인 또는 아이디로 시작하세요.</p>

            {enabledProviders.length > 0 && <><SocialLoginButtons enabledProviders={enabledProviders} next={next} />
            <div className="my-7 flex items-center gap-4 text-sm font-semibold text-[#6c7d76]">
              <span className="h-px flex-1 bg-[#dce4df]" />
              또는 아이디로 로그인
              <span className="h-px flex-1 bg-[#dce4df]" />
            </div></>}

            {errorMessage && (
              <p className="mb-6 rounded-2xl border border-[#eccdc8] bg-[#fff6f4] p-4 text-sm font-semibold leading-6 text-[#9b352d]" role="alert">
                {errorMessage}
              </p>
            )}

            <UsernameLoginForm next={next} />

            <div className="mt-4 text-right">
              <Link className="min-h-11 py-3 text-sm font-bold text-[#0d5b45] underline underline-offset-4" href="/account-recovery">아이디 찾기 · 비밀번호 재설정</Link>
            </div>

            <Link className="mt-3 flex min-h-14 items-center justify-center rounded-2xl border-2 border-[#0b543f] text-base font-extrabold text-[#0b543f]" href={signupHref}>회원가입</Link>

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
