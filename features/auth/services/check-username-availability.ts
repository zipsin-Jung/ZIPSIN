import { usernameSchema } from '@/features/auth/domain/username';

export type UsernameAvailabilityResult = {
  status: 'available' | 'unavailable' | 'invalid' | 'rate_limited' | 'temporarily_unavailable';
};

export type UsernameAvailabilityRepository = {
  findUsername(username: string): Promise<boolean>;
};

export async function checkUsernameAvailability(
  repository: UsernameAvailabilityRepository,
  username: string,
): Promise<UsernameAvailabilityResult> {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) return { status: 'invalid' };
  try {
    return { status: await repository.findUsername(parsed.data) ? 'unavailable' : 'available' };
  } catch {
    return { status: 'temporarily_unavailable' };
  }
}
