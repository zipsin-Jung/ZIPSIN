import Link from 'next/link';
import Brand from '@/components/Brand';
import { AccountRecoveryForm } from '@/features/auth/components/AccountRecoveryForm';

type Props = { searchParams: Promise<{ error?: string; notice?: string }> };

export default async function AccountRecoveryPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-[#f7f8f5] px-5 py-10 text-[#12362c]">
      <section className="mx-auto max-w-lg rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <Link href="/" aria-label="집신 처음으로"><Brand /></Link>
        <h1 className="mt-8 text-3xl font-black">아이디·비밀번호 찾기</h1>
        <p className="mt-3 mb-7 leading-7 text-slate-600">가입할 때 등록한 이메일 또는 인증된 휴대폰으로 계정을 확인합니다. 확인 전에는 가입 여부를 알려드리지 않습니다.</p>
        {params.error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-red-800" role="alert">올바른 이메일을 입력해 주세요.</p>}
        {params.notice === 'sent' && <p className="mb-5 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-900" role="status">계정이 확인되면 이메일로 안내를 보내드립니다.</p>}
        <AccountRecoveryForm />
        <Link className="mt-6 flex min-h-11 items-center justify-center font-bold text-[#0b543f]" href="/login">로그인으로 돌아가기</Link>
      </section>
    </main>
  );
}
