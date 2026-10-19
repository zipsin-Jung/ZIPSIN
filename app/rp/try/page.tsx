import type { Metadata, Viewport } from 'next';
import { RepairTryApp } from '@/features/zipsin-repair/try/RepairTryApp';

// 집신수리 체험판(배포 전 눌러 보기용, 2026-10-18 대표 요청). 검색에 노출하지 않는다.
export const metadata: Metadata = { title: '집신수리 체험판', robots: { index: false } };
export const viewport: Viewport = { themeColor: '#0B6655' };

export default function RepairTryPage() {
  return <RepairTryApp />;
}
