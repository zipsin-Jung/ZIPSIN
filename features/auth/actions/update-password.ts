'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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
  if (!data.user) redirect('/login?error=recovery_expired');

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect('/reset-password?error=update_failed');
  await supabase.auth.signOut();
  redirect('/login?notice=password_updated');
}
