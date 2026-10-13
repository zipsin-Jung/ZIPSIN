import 'server-only';

import {createServerSupabaseClient} from '@/lib/supabase/server';

export class AuthRequiredError extends Error {
  constructor() {
    super('AUTH_REQUIRED');
    this.name = 'AuthRequiredError';
  }
}

export async function requireUser(): Promise<{id: string; email?: string}> {
  const supabase = await createServerSupabaseClient();
  const {data: {user}, error} = await supabase.auth.getUser();
  if (error || !user) throw new AuthRequiredError();
  return {id: user.id, ...(user.email ? {email: user.email} : {})};
}
