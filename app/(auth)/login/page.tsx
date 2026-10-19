import Link from 'next/link';
import { ArrowLeft, CircleAlert, LockKeyhole } from 'lucide-react';
import { UsernameLoginForm } from '@/features/auth/components/UsernameLoginForm';
import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons';
import { SUPPORTED_PROVIDERS } from '@/features/auth/domain/providers';
import { getLoginError, type LoginErrorTone } from '@/features/auth/domain/login-error';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

const ALERT_STYLE: Record<LoginErrorTone, { box: string; ink: string }> = {
  danger: { box: 'border-[#E8B4AE] bg-[#FDF3F2]', ink: 'text-[#8C1D18]' },
  warning: { box: 'border-[#E6C78F] bg-[#FDF7EC]', ink: 'text-[#7A4A06]' },
  info: { box: 'border-[#B9C4CC] bg-[#F1F4F6]', ink: 'text-[#27394A]' },
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = getLoginError(params.error);
  const next = sanitizeNextPath(params.next);
  const signupHref = params.next ? `/signup?next=${encodeURIComponent(next)}` : '/signup';
  const enabledProviders = SUPPORTED_PROVIDERS
    .filter((provider) => process.env[`NEXT_PUBLIC_AUTH_${provider.id.toUpperCase()}_ENABLED`] === 'true')
    .map((provider) => provider.id);

  return (
    <main className="flex min-h-dvh flex-col items-center bg-white px-5 pb-36 pt-5 text-[#212124] sm:justify-center sm:gap-5 sm:bg-[#F6F7F5] sm:px-4 sm:py-14">
      <section
        aria-labelledby="login-title"
        className="flex w-full max-w-[460px] flex-1 flex-col gap-7 sm:flex-none sm:rounded-[20px] sm:border sm:border-[#EAEBEE] sm:bg-white sm:px-10 sm:pb-8 sm:pt-10 sm:shadow-[0_1px_2px_rgba(22,33,30,0.04),0_16px_40px_-24px_rgba(22,33,30,0.22)]"
      >
        <div className="flex flex-col gap-9 sm:gap-5">
          <Link aria-label="집신 처음 화면" className="inline-flex min-h-11 items-center gap-2.5 self-start" href="/">
            <img alt="" className="h-[30px] w-[36px] object-contain sm:h-[34px] sm:w-[40px]" src="/images/zipsin-company-logo.jpg" />
            <span className="flex flex-col leading-none">
              <strong className="text-lg font-bold tracking-[-0.4px] sm:text-xl">집신</strong>
              <span className="mt-1 text-[9px] font-bold tracking-[2px] text-[#6B7079]">ZIPSIN</span>
            </span>
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.6px] sm:text-[28px]" id="login-title">집신 로그인</h1>
            <p className="text-base leading-relaxed text-[#6B7079]">집과 사무소의 기록을 이어서 확인하세요.</p>
          </div>
        </div>

        {error && (
          <div className={`flex items-start gap-3 rounded-xl border p-4 ${ALERT_STYLE[error.tone].box}`} id="login-error" role="alert">
            <CircleAlert aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${ALERT_STYLE[error.tone].ink}`} />
            <div className="flex flex-col gap-1">
              <p className={`text-[15px] font-semibold leading-normal ${ALERT_STYLE[error.tone].ink}`}>{error.title}</p>
              <p className="text-sm leading-relaxed text-[#4D5159]">{error.body}</p>
            </div>
          </div>
        )}

        {enabledProviders.length > 0 && (
          <div className="flex flex-col gap-5">
            <SocialLoginButtons enabledProviders={enabledProviders} next={next} />
            <div className="flex items-center gap-3 text-sm text-[#6B7079]">
              <span aria-hidden="true" className="h-px flex-1 bg-[#EAEBEE]" />
              <span>또는 아이디로 로그인</span>
              <span aria-hidden="true" className="h-px flex-1 bg-[#EAEBEE]" />
            </div>
          </div>
        )}

        <UsernameLoginForm describedBy={error ? 'login-error' : undefined} hasError={Boolean(error)} next={next} />

        <p className="text-center text-[15px] text-[#4D5159]">
          집신이 처음이신가요?{' '}
          <Link className="inline-flex min-h-11 items-center font-semibold text-[#0B6655]! underline! underline-offset-[3px]" href={signupHref}>회원가입</Link>
        </p>

        <div className="mt-auto flex items-start gap-2.5 rounded-xl bg-[#F6F7F5] p-4 sm:mt-0 sm:rounded-none sm:border-t sm:border-[#EAEBEE] sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-[#0B6655]" />
          <p className="text-sm leading-relaxed text-[#6B7079]">집신은 권한 없이 집의 기록을 공개하지 않습니다.</p>
        </div>
      </section>
      <Link className="hidden min-h-11 items-center gap-1.5 text-sm text-[#4D5159] sm:inline-flex" href="/">
        <ArrowLeft aria-hidden="true" className="size-4" />
        집신 처음 화면으로
      </Link>
    </main>
  );
}
