import Link from 'next/link';
import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons';
import type { SocialProviderId } from '@/features/auth/domain/providers';

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const enabledProviders = (['google', 'kakao', 'naver'] as const).filter(
    (provider) =>
      process.env[`NEXT_PUBLIC_AUTH_${provider.toUpperCase()}_ENABLED`] === 'true',
  ) as SocialProviderId[];

  return (
    <main className="min-h-screen bg-[#f8faf8] px-5 py-12 text-[#12362c]">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <Link className="text-sm font-semibold text-emerald-900" href="/">
          ← 집신 소개로 돌아가기
        </Link>
        <p className="mt-10 text-sm font-semibold text-emerald-700">ZIPSIN</p>
        <h1 className="mt-2 text-3xl font-bold">간편하게 시작하세요</h1>
        <p className="mt-3 mb-8 text-base leading-7 text-slate-600">
          가입 후 휴대전화 인증과 필수 동의를 완료하면 첫 집을 등록할 수 있습니다.
        </p>
        {params.error && (
          <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">
            로그인을 완료하지 못했습니다. 다시 시도해 주세요.
          </p>
        )}
        <SocialLoginButtons enabledProviders={enabledProviders} next={params.next} />
        <p className="mt-7 text-sm leading-6 text-slate-500">
          제공자 설정이 끝나지 않은 로그인은 준비 중으로 표시됩니다.
        </p>
      </section>
    </main>
  );
}
