import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { isAccountOpen } from '@/lib/site/account-launch';

/**
 * 2026-10-17 사용자 결정: 로그인·회원가입·계정 찾기는 '준비 중'으로 두고 공개 홈·집신체크만 먼저 연다.
 * 스위치는 NEXT_PUBLIC_ACCOUNT_OPEN(lib/site/account-launch.ts) 하나다.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  if (isAccountOpen()) return children;
  return (
    <AuthCard title="로그인 · 회원가입 준비 중" titleId="account-preparing-title" subtitle="곧 열려요. 집신체크는 로그인 없이 지금 바로 쓸 수 있어요.">
      <div className="flex flex-col gap-3">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B6655] px-5 text-[16px] font-bold text-white!" href="/ck">집신체크 바로 쓰기</Link>
        <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#BFD3CD] px-5 text-[16px] font-bold text-[#0B6655]!" href="/">집신 처음 화면</Link>
      </div>
    </AuthCard>
  );
}
