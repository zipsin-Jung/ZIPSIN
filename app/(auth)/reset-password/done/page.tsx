import Link from 'next/link';
import { Check } from 'lucide-react';
import { AuthCard, authPrimaryButtonClass } from '@/features/auth/components/AuthCard';

// 2026-10-16 승인 시안 ⑨-C: 비밀번호 변경 완료.
export default function ResetPasswordDonePage() {
  return (
    <AuthCard showLogo={false} title="비밀번호를 바꿨어요" titleId="reset-done-title">
      <div aria-hidden="true" className="-order-1 grid size-14 place-items-center rounded-2xl bg-[#EAF2EF]">
        <Check className="size-7 text-[#0B6655]" strokeWidth={2.2} />
      </div>
      <p className="-mt-3 text-base leading-[1.7] text-[#3E4B47]">새 비밀번호로 로그인해 주세요.</p>
      <Link className={authPrimaryButtonClass} href="/login">로그인하기</Link>
    </AuthCard>
  );
}
