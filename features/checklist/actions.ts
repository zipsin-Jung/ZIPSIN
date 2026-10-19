'use server';

import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { STAGES } from '@/features/checklist/domain';

const schema = z.object({ stage: z.string(), itemKey: z.string(), homeId: z.uuid().nullable(), checked: z.boolean() });

/** 체크하면 바로 저장. 알 수 없는 단계·항목은 거절한다. */
export async function toggleChecklistAction(input: z.infer<typeof schema>): Promise<{ ok: boolean }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const stage = STAGES.find((candidate) => candidate.id === parsed.data.stage);
  if (!stage?.items.some((item) => item.key === parsed.data.itemKey)) return { ok: false };
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('toggle_checklist_item', { p_stage: stage.id, p_item_key: parsed.data.itemKey, p_home_id: parsed.data.homeId, p_checked: parsed.data.checked });
  return { ok: !error };
}
