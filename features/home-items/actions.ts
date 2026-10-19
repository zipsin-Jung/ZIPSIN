'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { HOME_ITEM_CATEGORIES } from '@/features/home-items/domain';

const date = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/)]);
const schema = z.object({
  homeId: z.uuid(),
  category: z.enum(HOME_ITEM_CATEGORIES.map((category) => category.id) as [string, ...string[]]),
  name: z.string().trim().min(1).max(40),
  installedOn: date,
  replacedOn: date,
  note: z.string().max(200),
});

const toDate = (value: string) => (value ? (value.length === 7 ? `${value}-01` : value) : null);

export async function saveHomeItemAction(formData: FormData) {
  const parsed = schema.safeParse({
    homeId: formData.get('homeId'), category: formData.get('category'), name: formData.get('name'),
    installedOn: formData.get('installedOn') ?? '', replacedOn: formData.get('replacedOn') ?? '', note: formData.get('note') ?? '',
  });
  const homeId = String(formData.get('homeId') ?? '');
  if (!parsed.success) redirect(`/homes/${z.uuid().safeParse(homeId).success ? homeId : ''}/history?error=invalid`);
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('save_home_item', {
    p_home_id: parsed.data.homeId, p_item_id: null, p_category: parsed.data.category, p_name: parsed.data.name,
    p_installed_on: toDate(parsed.data.installedOn), p_replaced_on: toDate(parsed.data.replacedOn), p_note: parsed.data.note || null,
  });
  redirect(`/homes/${parsed.data.homeId}/history${error ? '?error=save' : '?saved=1'}`);
}

export async function archiveHomeItemAction(formData: FormData) {
  const homeId = String(formData.get('homeId') ?? '');
  const itemId = String(formData.get('itemId') ?? '');
  if (!z.uuid().safeParse(homeId).success || !z.uuid().safeParse(itemId).success) redirect('/home');
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('archive_home_item', { p_item_id: itemId });
  redirect(`/homes/${homeId}/history${error ? '?error=save' : ''}`);
}
