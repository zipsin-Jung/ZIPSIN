import Link from 'next/link';
import Brand from '@/components/Brand';
import { PasswordSignupForm } from '@/features/auth/components/PasswordSignupForm';

type Props = { searchParams: Promise<{ error?: string; notice?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = params.error
    ? params.error === 'invalid_input'
      ? '입력한 내용을 다시 확인해 주세요.'
      : '이미 사용 중인 계정 정보이거나 지금 가입할 수 없습니다.'
    : null;

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-5 py-8 text-[#12362c]">
      <header className="mx-auto flex max-w-2xl items-center justify-between">
        <Link href="/" aria-label="집신 처음으로"><Brand /></Link>
        <Link className="font-bold text-[#31584a]" href="/login">로그인</Link>
      </header>
      <section className="mx-auto mt-8 max-w-2xl rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <p className="text-sm font-extrabold tracking-widest text-[#aa772a]">ZIPSIN ACCOUNT</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">회원가입</h1>
        <p className="mt-3 mb-8 leading-7 text-slate-600">아이디와 이메일을 등록한 뒤 휴대전화 인증을 이어갑니다.</p>
        {params.notice === 'check_email' && <p className="mb-6 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-900" role="status">가입 이메일로 보낸 확인 링크를 눌러 주세요.</p>}
        {error && <p className="mb-6 rounded-xl bg-red-50 p-4 font-semibold text-red-800" role="alert">{error}</p>}
        <PasswordSignupForm />
      </section>
    </main>
  );
}
