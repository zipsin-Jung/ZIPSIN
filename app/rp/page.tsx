import { PreparingSite, preparingMetadata } from '@/features/sub-sites/components/PreparingSite';

// zipsin.net/rp — rp.zipsin.net 주소가 연결되기 전에도 같은 준비 중 화면(2026-10-18).
export const metadata = preparingMetadata('repair');

export default function RepairPreparingPage() {
  return <PreparingSite homeHref="/" service="repair" />;
}
