import { CheckPage, checkMetadata, checkViewport } from '@/features/zipsin-check/check-page';

export const metadata = checkMetadata('/ck');
export const viewport = checkViewport;

export default function CheckPublicPage() {
  return <CheckPage />;
}
