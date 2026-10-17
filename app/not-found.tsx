import type { Metadata } from 'next';
import { ErrorScreen } from '@/components/system/ErrorScreen';

export const metadata: Metadata = { title: '페이지를 찾을 수 없어요 | 집신' };

export default function NotFound() {
  return <ErrorScreen title="페이지를 찾을 수 없어요" message="주소가 바뀌었거나 없는 페이지예요. 아래 버튼으로 이동해 주세요." />;
}
