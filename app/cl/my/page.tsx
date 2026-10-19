import type { Metadata } from 'next';
import { CleanDemoShell } from '@/features/zipsin-clean/components/CleanDemoShell';
import { CleanMyPage } from '@/features/zipsin-clean/components/CleanMyPage';
import { CleanPreparing } from '@/features/zipsin-clean/components/CleanPreparing';
import { isCleanDemoOpen } from '@/features/zipsin-clean/domain/demo';

/** 집신청소 손님 마이페이지 체험. 실서비스에서는 준비 중 화면만 보인다. */
export const metadata: Metadata = {
  title: '집신청소 · 마이페이지 (체험)',
  robots: { index: false },
};

export default function CleanMyPageRoute() {
  if (!isCleanDemoOpen()) return <CleanPreparing homeHref="/" />;
  return (
    <CleanDemoShell links={[{ href: '/cl', label: '가격 보기' }, { href: '/cl/partner', label: '업체 화면' }]}>
      <CleanMyPage />
    </CleanDemoShell>
  );
}
