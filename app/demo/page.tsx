import type {Metadata} from 'next';
import SalesDemo from '@/components/SalesDemo';

export const metadata: Metadata = {
  title: '공인중개사 3분 데모 | 집신',
  description: '집별 기록과 보조원 업무 인수인계를 체험하는 비저장형 가상 데모',
};

export default function DemoPage() {
  return <SalesDemo/>;
}
