import type { ShellLink } from '@/features/zipsin-clean/components/CleanShell';
import type { CleanViewer } from '@/features/zipsin-clean/server/viewer';

export function cleanLinks(viewer: CleanViewer, current: string): ShellLink[] {
  const links: ShellLink[] = [{ href: '/cl', label: '청소 예약' }];
  if (!viewer) links.push({ href: `/login?next=${encodeURIComponent(current)}`, label: '로그인' });
  else {
    links.push({ href: '/cl/my', label: '마이페이지' });
    links.push({ href: '/cl/partner', label: '업체' });
    if (viewer.isOperator) links.push({ href: '/cl/admin', label: '관리' });
  }
  return links.map((link) => ({ ...link, current: link.href === current }));
}
