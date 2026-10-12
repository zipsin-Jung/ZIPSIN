import type {Metadata} from 'next';
import ZipsinCheckApp from '@/components/zipsin-check/ZipsinCheckApp';

export const metadata: Metadata = {
  title: '집신체크 | 집 보기 체크리스트',
  description: '빠르게 또는 꼼꼼하게 집을 확인하고 후보를 같은 기준으로 비교하세요.',
  alternates: {canonical: '/check'},
};

export default function CheckPage() {
  return <ZipsinCheckApp/>;
}
