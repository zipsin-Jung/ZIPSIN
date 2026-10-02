'use server';

import { redirect } from 'next/navigation';
import { parsePrimaryRole } from '@/features/auth/domain/roles';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function savePrimaryRole(value: string) {
  const primaryRole = parsePrimaryRole(value);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const { error } = await supabase.from('user_roles').upsert({
    user_id: data.user.id,
    primary_role: primaryRole,
  });
  if (error) return { ok: false as const, error: 'save_failed' as const };
  redirect('/home');
}
