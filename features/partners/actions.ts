'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { validatePartnerFile } from '@/features/partners/domain';

export async function startPartnerApplicationAction(formData: FormData) {
  const kind = formData.get('kind');
  const name = String(formData.get('businessName') ?? '').trim();
  if (kind !== 'broker' || name.length < 2 || name.length > 60) redirect('/partners/new?error=name');
  const { supabase } = await requireOnboardingComplete();
  const { data, error } = await supabase.rpc('start_partner_application', { p_kind: kind, p_business_name: name });
  if (error || !data) redirect(`/partners/new?error=${error?.message.includes('permission_denied') ? 'phone' : 'save'}`);
  redirect(`/partners/${data}`);
}

const prepareSchema = z.object({
  applicationId: z.uuid(),
  kind: z.enum(['business_registration', 'brokerage_registration', 'broker_license']),
  name: z.string().min(1).max(200),
  type: z.string(),
  size: z.number(),
});

export async function preparePartnerDocumentAction(input: z.infer<typeof prepareSchema>): Promise<{ ok: true; documentId: string; storagePath: string } | { ok: false; error: string }> {
  const parsed = prepareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: '파일 정보를 확인해 주세요.' };
  const invalid = validatePartnerFile(parsed.data);
  if (invalid) return { ok: false, error: invalid };
  const { supabase } = await requireOnboardingComplete();
  const { data, error } = await supabase.rpc('prepare_partner_document', {
    p_application_id: parsed.data.applicationId, p_kind: parsed.data.kind, p_original_name: parsed.data.name, p_media_type: parsed.data.type, p_byte_size: parsed.data.size,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return { ok: false, error: error?.message.includes('application_locked') ? '이미 보낸 신청이라 서류를 바꿀 수 없어요.' : '올릴 준비를 하지 못했어요.' };
  return { ok: true, documentId: row.document_id, storagePath: row.storage_path };
}

export async function completePartnerDocumentAction(documentId: string): Promise<{ ok: boolean }> {
  if (!z.uuid().safeParse(documentId).success) return { ok: false };
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('complete_partner_document', { p_document_id: documentId });
  return { ok: !error };
}

export async function submitPartnerApplicationAction(formData: FormData) {
  const id = String(formData.get('applicationId') ?? '');
  if (!z.uuid().safeParse(id).success) redirect('/partners/new');
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('submit_partner_application', { p_application_id: id });
  redirect(`/partners/${id}${error ? `?error=${error.message.includes('documents_required') ? 'docs' : 'save'}` : ''}`);
}
