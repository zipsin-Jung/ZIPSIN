'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getRuntimeAuthCookieOptions, SESSION_ONLY_COOKIE } from '@/lib/supabase/cookie-options';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    redirect('/my?error=logout_failed');
    return;
  }
  (await cookies()).delete({ name: SESSION_ONLY_COOKIE, ...getRuntimeAuthCookieOptions() });
  redirect('/');
}
