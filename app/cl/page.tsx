import type { Metadata } from 'next';
import { CleanApp } from '@/features/zipsin-clean/components/CleanApp';
import { CleanDemoShell } from '@/features/zipsin-clean/components/CleanDemoShell';
import { CleanPreparing } from '@/features/zipsin-clean/components/CleanPreparing';
import { isCleanDemoOpen } from '@/features/zipsin-clean/domain/demo';

/**
 * 집신클린 (DEC-031). 집신체크처럼 같은 앱 안의 별도 서비스.
 * 배포 전에는 Preview에서만 처음부터 끝까지 눌러 볼 수 있는 체험 화면을 연다.
 * 실서비스(VERCEL_ENV=production)에서는 준비 중 화면만 보인다.
 */
export const metadata: Metadata = {
  title: '집신클린 · 청소 가격 바로 보기',
  description: '사실만 고르면 가격이 하나로 나와요. 작업을 시작한 뒤에는 가격이 바뀌지 않아요.',
  robots: { index: false },
};

export default function CleanPage() {
  if (!isCleanDemoOpen()) return <CleanPreparing />;
  return (
    <CleanDemoShell links={[{ href: '/cl/my', label: '마이페이지' }, { href: '/cl/partner', label: '업체 화면' }]}>
      <CleanApp />
    </CleanDemoShell>
  );
}
