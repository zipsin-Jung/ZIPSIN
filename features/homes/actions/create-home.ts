'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { homeSchema, homeFieldErrors, type HomeFormState } from '@/features/homes/schemas/home';
import { createHome } from '@/features/homes/services/create-home';
import { workspaceErrorMessage } from '@/features/workspace/domain/errors';
export async function createHomeAction(formData: FormData): Promise<HomeFormState> {
  const { supabase } = await requireOnboardingComplete();
  const parsed = homeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: homeFieldErrors(parsed.error) };
  const result = await createHome({
    create: async (input) => supabase.rpc('create_home_for_office', {
      p_office_id: input.officeId, p_address_line1: input.addressLine1,
      p_address_detail: input.addressDetail, p_home_label: input.homeLabel,
      p_idempotency_key: input.idempotencyKey,
    }),
  }, parsed.data);
  if (!result.ok) return { error: workspaceErrorMessage(result.error) };
  revalidatePath('/home'); revalidatePath('/homes');
  redirect(`/homes/${result.homeId}`);
}
