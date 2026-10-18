'use server';
import { revalidatePath } from 'next/cache';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { recordSchema } from '@/features/records/schemas/record';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

export type RecordFormState = { error?: string; fieldErrors?: Record<string, string>; redirectTo?: string; recordId?: string };
export async function createRecordAction(formData: FormData): Promise<RecordFormState> {
  const { supabase } = await requireOnboardingComplete();
  const parsed = recordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])) };
  const value = parsed.data;
  const { data: recordId, error } = await supabase.rpc('create_home_record', {
    p_home_id: value.homeId, p_office_id: value.officeId || null, p_contract_id: value.contractId || null,
    p_space: value.space, p_kind: value.kind, p_title: value.title, p_body: value.body,
    p_idempotency_key: value.idempotencyKey, p_task_due_at: value.taskDueAt || null,
    p_task_assigned_to: value.taskAssignedTo || null,
  });
  if (error) return { error: workspaceErrorMessage(toWorkspaceErrorCode(error)) };
  revalidatePath(`/homes/${value.homeId}`); revalidatePath('/tasks');
  return { recordId: typeof recordId === 'string' ? recordId : undefined, redirectTo: `/homes/${value.homeId}` };
}
