import type { Metadata } from 'next';
import { CleanDemoShell } from '@/features/zipsin-clean/components/CleanDemoShell';
import { CleanPreparing } from '@/features/zipsin-clean/components/CleanPreparing';
import { PartnerApp } from '@/features/zipsin-clean/components/PartnerApp';
import { isCleanDemoOpen } from '@/features/zipsin-clean/domain/demo';

/** 집신클린 업체 화면 체험. 실서비스에서는 준비 중 화면만 보인다. */
export const metadata: Metadata = {
  title: '집신클린 · 업체 화면 (체험)',
  robots: { index: false },
};

export default function CleanPartnerPage() {
  if (!isCleanDemoOpen()) return <CleanPreparing />;
  return (
    <CleanDemoShell switchHref="/cl" switchLabel="손님 화면">
      <PartnerApp />
    </CleanDemoShell>
  );
}
