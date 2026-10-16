'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { digestRecoveryToken, RECOVERY_COOKIE } from '@/features/auth/server/recovery-session';
import { accountPasswordSchema } from '@/features/auth/schemas/password-signup';

const schema = z.object({
  password: accountPasswordSchema,
  passwordConfirm: z.string().min(8).max(128),
}).refine((value) => value.password === value.passwordConfirm);

export async function updatePasswordAction(formData: FormData) {
  const parsed = schema.safeParse({
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
  });
  if (!parsed.success) redirect('/reset-password?error=invalid_password');

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const recoveryToken = cookieStore.get(RECOVERY_COOKIE)?.value;
  if (!data.user && !recoveryToken) redirect('/login?error=recovery_expired');

  if (!data.user && recoveryToken) {
    const admin = createAdminSupabaseClient();
    const { data: userId, error: consumeError } = await admin.rpc('consume_account_recovery_session', { p_token_digest: digestRecoveryToken(recoveryToken) });
    if (consumeError || !userId) redirect('/login?error=recovery_expired');
    const { error } = await admin.auth.admin.updateUserById(userId, { password: parsed.data.password });
    if (error) redirect('/reset-password?error=update_failed');
    cookieStore.delete(RECOVERY_COOKIE);
    redirect('/reset-password/done');
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect('/reset-password?error=update_failed');
  await supabase.auth.signOut();
  redirect('/reset-password/done');
}
