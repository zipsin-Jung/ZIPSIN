'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { CONTACT_CATEGORIES, normalizePhone } from '@/features/contacts/domain';

const schema = z.object({
  homeId: z.union([z.literal(''), z.uuid()]),
  category: z.enum(CONTACT_CATEGORIES.map((category) => category.id) as [string, ...string[]]),
  name: z.string().trim().min(1).max(40),
  phone: z.string().max(30),
  memo: z.string().max(200),
});

export async function addContactAction(formData: FormData) {
  const parsed = schema.safeParse({ homeId: formData.get('homeId') ?? '', category: formData.get('category'), name: formData.get('name') ?? '', phone: formData.get('phone') ?? '', memo: formData.get('memo') ?? '' });
  const back = (query: string) => redirect(`/contacts${query}`);
  if (!parsed.success) back('?error=input');
  const data = parsed.data!;
  const phone = data.phone.trim() ? normalizePhone(data.phone) : null;
  if (data.phone.trim() && !phone) back('?error=phone');
  const { supabase, user } = await requireOnboardingComplete();
  const { error } = await supabase.from('home_contacts').insert({ user_id: user.id, home_id: data.homeId || null, category: data.category, name: data.name, phone, memo: data.memo.trim() || null });
  back(error ? '?error=save' : `?saved=1${data.homeId ? `&home=${data.homeId}` : ''}`);
}

export async function deleteContactAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!z.uuid().safeParse(id).success) redirect('/contacts');
  const { supabase } = await requireOnboardingComplete();
  await supabase.from('home_contacts').delete().eq('id', id);
  redirect('/contacts');
}
