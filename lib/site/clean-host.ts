// cl.zipsin.net = 집신청소(DEC-036, 옛 이름 집신클린). 판별은 sub-sites.ts 한곳에서 한다.
import { isSubSiteHost } from '@/lib/site/sub-sites';

export function isCleanHost(host: string | null | undefined): boolean {
  return isSubSiteHost('clean', host);
}
