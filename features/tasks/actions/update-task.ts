'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

const schema = z.object({ recordId: z.uuid(), status: z.enum(['todo', 'in_progress', 'done']) });
export async function updateTaskStateAction(formData: FormData): Promise<void> {
  const { supabase } = await requireOnboardingComplete(); const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(workspaceErrorMessage('invalid_input'));
  const { error } = await supabase.rpc('update_task_state', { p_record_id: parsed.data.recordId, p_status: parsed.data.status });
  if (error) throw new Error(workspaceErrorMessage(toWorkspaceErrorCode(error))); revalidatePath('/tasks');
}
