'use server';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {createRepair, deleteRepair, updateRepair} from '@/lib/repairs/repository';
import {validateRepairFormData} from '@/lib/repairs/schema';
import type {RepairActionState} from '@/lib/repairs/types';

export async function createRepairAction(_previous: RepairActionState, formData: FormData): Promise<RepairActionState> {
  const parsed = validateRepairFormData(formData);
  if (!parsed.success) return {message: '입력한 내용을 확인해 주세요.', errors: parsed.errors, values: parsed.values};
  let id = '';
  try { id = (await createRepair(parsed.data, parsed.image)).id; }
  catch (error) { console.error(error); return {message: '기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.', values: parsed.success ? formValues(formData) : undefined}; }
  revalidatePath('/records');
  redirect(`/records/${id}?created=1`);
}

export async function updateRepairAction(id: string, _previous: RepairActionState, formData: FormData): Promise<RepairActionState> {
  const parsed = validateRepairFormData(formData);
  if (!parsed.success) return {message: '입력한 내용을 확인해 주세요.', errors: parsed.errors, values: parsed.values};
  let cleanupWarning = false;
  try {
    const updated = await updateRepair(id, parsed.data, parsed.image, parsed.removeImage);
    if (!updated) return {message: '수정할 기록을 찾지 못했어요.'};
    cleanupWarning = updated.cleanupWarning;
  } catch (error) { console.error(error); return {message: '변경 내용을 저장하지 못했어요. 다시 시도해 주세요.', values: formValues(formData)}; }
  revalidatePath('/records'); revalidatePath(`/records/${id}`);
  redirect(`/records/${id}?updated=1${cleanupWarning ? '&cleanup=1' : ''}`);
}

export async function deleteRepairAction(id: string): Promise<{error?: string}> {
  let cleanupWarning = false;
  try {
    const result = await deleteRepair(id);
    if (!result.deleted) return {error: '이미 삭제되었거나 없는 기록입니다.'};
    cleanupWarning = result.cleanupWarning;
  } catch (error) { console.error(error); return {error: '기록을 삭제하지 못했어요. 다시 시도해 주세요.'}; }
  revalidatePath('/records');
  redirect(`/records?deleted=1${cleanupWarning ? '&cleanup=1' : ''}`);
}

function formValues(formData: FormData) {
  return Object.fromEntries(['title','homeAlias','category','status','description','repairDate'].map((key) => [key, String(formData.get(key) ?? '')]));
}
