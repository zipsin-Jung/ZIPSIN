import { isCleanServiceOpen } from '@/features/zipsin-clean/domain/constants';
import { isAccountOpen } from '@/lib/site/account-launch';

/** 지금 이 배포에서 집신청소가 열려 있는지. */
export function cleanOpenNow(): boolean {
  return isCleanServiceOpen({ accountOpen: isAccountOpen(), vercelEnv: process.env.VERCEL_ENV, flag: process.env.NEXT_PUBLIC_CLEAN_OPEN });
}
