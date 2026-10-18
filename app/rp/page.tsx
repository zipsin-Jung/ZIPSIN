import type { Metadata } from 'next';
import { RepairPreparing } from '@/features/zipsin-repair/components/RepairPreparing';

// zipsin.net/rp: rp.zipsin.net 연결 전에도 홈 상단 "집신수리"에서 같은 준비 중 화면을 보여 준다(2026-10-18 대표 지시).
export const metadata: Metadata = { title: '집신수리 · 서비스 준비 중', robots: { index: false } };

export default function RepairPreparingPage() {
  return <RepairPreparing />;
}
