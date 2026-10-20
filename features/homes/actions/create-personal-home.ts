'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

const schema = z.object({
  addressLine1: z.string().trim().min(5).max(200),
  addressDetail: z.string().trim().max(120),
  homeLabel: z.string().trim().max(80),
  relation: z.enum(['tenant', 'landlord']),
  idempotencyKey: z.uuid(),
});

/** 고객이 직접 집 추가 (개인 기록 공간, 202610200001). 다른 사람은 초대하기 전까지 볼 수 없다. */
export async function createPersonalHomeAction(formData: FormData) {
  const parsed = schema.safeParse({
    addressLine1: formData.get('addressLine1') ?? '', addressDetail: formData.get('addressDetail') ?? '',
    homeLabel: formData.get('homeLabel') ?? '', relation: formData.get('relation'), idempotencyKey: formData.get('idempotencyKey'),
  });
  if (!parsed.success) redirect('/homes/new?mine=1&error=input');
  const { supabase } = await requireOnboardingComplete();
  const { data, error } = await supabase.rpc('create_personal_home', {
    p_address_line1: parsed.data.addressLine1, p_address_detail: parsed.data.addressDetail || null,
    p_home_label: parsed.data.homeLabel || null, p_relation: parsed.data.relation, p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error || !data) redirect(`/homes/new?mine=1&error=${error?.message.includes('permission_denied') ? 'phone' : 'save'}`);
  redirect(`/homes/${data}`);
}
