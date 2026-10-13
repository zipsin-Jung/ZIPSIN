import Link from 'next/link';
import Brand from '@/components/Brand';
import { PasswordSignupForm } from '@/features/auth/components/PasswordSignupForm';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';

type Props = { searchParams: Promise<{ error?: string; notice?: string; next?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = sanitizeNextPath(params.next);
  const loginHref = params.next ? `/login?next=${encodeURIComponent(next)}` : '/login';
  const currentStep = params.notice === 'check_email' ? 1 : 0;
  const error = params.error
    ? params.error === 'invalid_input'
      ? '입력한 내용을 다시 확인해 주세요.'
      : '이미 사용 중인 계정 정보이거나 지금 가입할 수 없습니다.'
    : null;

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-5 py-8 text-[#12362c]">
      <header className="mx-auto flex max-w-2xl items-center justify-between">
        <Link href="/" aria-label="집신 처음으로"><Brand /></Link>
        <Link className="font-bold text-[#31584a]" href={loginHref}>로그인</Link>
      </header>
      <section className="mx-auto mt-8 max-w-2xl rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <p className="text-sm font-extrabold tracking-widest text-[#aa772a]">ZIPSIN ACCOUNT</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">회원가입</h1>
        <p className="mt-3 leading-7 text-slate-600">아이디와 이메일을 등록한 뒤 휴대전화 번호 인증을 이어갑니다.</p>
        <ol aria-label="회원가입 진행 단계" className="my-7 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {['1 계정 만들기', '2 이메일 확인', '3 휴대전화 인증', '4 역할 선택'].map((step, index) => (
            <li aria-current={index === currentStep ? 'step' : undefined} className={index === currentStep ? 'rounded-xl bg-emerald-900 px-3 py-3 font-bold text-white' : 'rounded-xl bg-slate-100 px-3 py-3 font-semibold text-slate-600'} key={step}>{step}</li>
          ))}
        </ol>
        <p className="mb-8 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          휴대전화 번호 인증은 가입 과정에서 진행합니다. 가입 후에는 휴대전화·노트북·PC에서도 같은 계정으로 이용할 수 있습니다.
        </p>
        {params.notice === 'check_email' && <p className="mb-6 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-900" role="status">가입 이메일로 보낸 확인 링크를 눌러 주세요.</p>}
        {error && <p className="mb-6 rounded-xl bg-red-50 p-4 font-semibold text-red-800" role="alert">{error}</p>}
        <PasswordSignupForm next={params.next ? next : undefined} />
      </section>
    </main>
  );
}
