import { PreparingSite } from '@/features/sub-sites/components/PreparingSite';

/** cl.zipsin.net 준비 중 화면. 집신청소·집신수리 공용 화면을 쓴다(2026-10-18 승인 시안). */
export function CleanPreparing({ homeHref = 'https://zipsin.net/' }: { homeHref?: string }) {
  return <PreparingSite homeHref={homeHref} service="clean" />;
}
