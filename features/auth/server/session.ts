import 'server-only';

import {createServerSupabaseClient} from '@/lib/supabase/server';

export class AuthRequiredError extends Error {
  constructor() {
    super('AUTH_REQUIRED');
    this.name = 'AuthRequiredError';
  }
}

export class PhoneVerificationRequiredError extends Error {
  constructor() {
    super('PHONE_VERIFICATION_REQUIRED');
    this.name = 'PhoneVerificationRequiredError';
  }
}

export async function requireUser(): Promise<{id: string; email?: string}> {
  const supabase = await createServerSupabaseClient();
  const {data: {user}, error} = await supabase.auth.getUser();
  if (error || !user) throw new AuthRequiredError();
  return {id: user.id, ...(user.email ? {email: user.email} : {})};
}

export async function requirePhoneVerifiedUser(): Promise<{id: string; email?: string}> {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('profiles')
    .select('phone_verified_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data?.phone_verified_at) throw new PhoneVerificationRequiredError();
  return user;
}
