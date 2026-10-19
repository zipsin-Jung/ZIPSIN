import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { PasswordSignupForm } from '@/features/auth/components/PasswordSignupForm';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';
import { SUPPORTED_PROVIDERS } from '@/features/auth/domain/providers';
import { isAccountOpen } from '@/lib/site/account-launch';

type Props = { searchParams: Promise<{ error?: string; next?: string }> };

// 2026-10-16 승인 시안 ⑤⑥: 로그인과 같은 가운데 카드. 이메일 확인 단계는 없다.
export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = sanitizeNextPath(params.next);
  const isCheckSignup = next === '/ck' || next.startsWith('/ck/');
  const loginHref = params.next ? `/login?next=${encodeURIComponent(next)}` : '/login';
  const error = params.error
    ? params.error === 'invalid_input'
      ? '입력한 내용을 다시 확인해 주세요.'
      : params.error === 'service_unavailable'
        ? '가입 설정을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.'
        : '이미 사용 중인 계정 정보이거나 지금 가입할 수 없습니다.'
    : null;

  if (!isAccountOpen()) {
    // 간편 로그인 안내는 실제로 켜진 제공자가 있을 때만 보여준다(막다른 안내 방지).
    const socialOn = SUPPORTED_PROVIDERS.some((provider) => process.env[`NEXT_PUBLIC_AUTH_${provider.id.toUpperCase()}_ENABLED`] === 'true');
    return (
      <AuthCard title="회원가입 준비 중" titleId="signup-title" subtitle={socialOn ? '회원가입은 곧 열려요. 지금은 간편 로그인으로 시작해 주세요.' : '회원가입은 곧 열려요. 집신체크는 로그인 없이 지금 바로 쓸 수 있어요.'}>
        <div className="flex flex-col gap-3">
          {socialOn && <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B6655] px-5 text-[16px] font-bold text-white!" href={loginHref}>간편 로그인으로 시작</Link>}
          <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#BFD3CD] px-5 text-[16px] font-bold text-[#0B6655]!" href="/ck">집신체크 바로 쓰기</Link>
          <p className="text-center text-[15px] text-[#4D5159]">
            이미 계정이 있나요?{' '}
            <Link className="inline-flex min-h-11 items-center font-semibold text-[#0B6655]! underline! underline-offset-[3px]" href={loginHref}>로그인</Link>
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      headerAside={<Link className="inline-flex min-h-11 items-center text-[15px] font-semibold text-[#0B6655]! sm:hidden" href={loginHref}>로그인</Link>}
      notice="휴대폰 인증은 본인 계정 확인용이에요. 집이나 계약 기록은 초대·권한이 있어야 보여요."
      subtitle={isCheckSignup
        ? '휴대폰 인증까지 한 화면에서 가입을 마치면 집신체크로 바로 돌아가요.'
        : '한 번 가입하면 휴대전화와 PC에서 같은 계정으로 이용해요.'}
      title="집신 회원가입"
      titleId="signup-title"
      wide
    >
      {error && <p className="rounded-xl border border-[#E8B4AE] bg-[#FDF3F2] p-4 text-[15px] font-semibold text-[#8C1D18]" role="alert">{error}</p>}
      <PasswordSignupForm next={params.next ? next : undefined} />
      <p className="text-center text-[15px] text-[#4D5159]">
        이미 계정이 있나요?{' '}
        <Link className="inline-flex min-h-11 items-center font-semibold text-[#0B6655]! underline! underline-offset-[3px]" href={loginHref}>로그인</Link>
      </p>
    </AuthCard>
  );
}
