import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AccountRecoveryForm } from '@/features/auth/components/AccountRecoveryForm';

type Props = { searchParams: Promise<{ tab?: string }> };

// 2026-10-16 승인 시안 ⑧⑨: 아이디 찾기(이메일 → 화면에 바로) · 비밀번호 재설정(이름 + 휴대폰 인증).
export default async function AccountRecoveryPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <AuthCard
      notice="여러 번 잘못 입력하면 잠시 찾기를 막아 다른 사람의 계정을 보호해요."
      title="아이디·비밀번호 찾기"
      titleId="find-title"
    >
      <AccountRecoveryForm initialTab={params.tab === 'password' ? 'password' : 'username'} />
      <Link className="-mt-2 inline-flex min-h-11 items-center justify-center text-[15px] font-semibold text-[#0B6655]!" href="/login">로그인으로 돌아가기</Link>
    </AuthCard>
  );
}
