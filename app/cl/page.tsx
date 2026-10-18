import { PreparingSite, preparingMetadata } from '@/features/sub-sites/components/PreparingSite';

// zipsin.net/cl — cl.zipsin.net 주소가 연결되기 전에도 같은 준비 중 화면(2026-10-18).
export const metadata = preparingMetadata('clean');

export default function CleanPreparingPage() {
  return <PreparingSite homeHref="/" service="clean" />;
}
