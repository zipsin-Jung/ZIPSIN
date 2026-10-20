'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/features/auth/guards/require-onboarding';
import { createUntypedAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.rpc('is_platform_admin');
  if (data !== true) redirect('/');
  return user;
}

/**
 * 파트너 신청 승인/반려. 승인하면 그 사람이 대표인 사무소를 만들어 '파트너로 전환'이 열린다.
 * 서버(service role)에서만 바꾼다. 누가 언제 했는지는 reviewed_at·review_note로 남긴다.
 */
export async function reviewPartnerAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const decision = formData.get('decision');
  const note = String(formData.get('note') ?? '').trim().slice(0, 300) || null;
  if (!z.uuid().safeParse(id).success || (decision !== 'approve' && decision !== 'reject')) redirect('/admin/partners?error=input');
  if (decision === 'reject' && !note) redirect('/admin/partners?error=note');
  const admin = createUntypedAdminClient();
  const { data: application } = await admin.from('partner_applications').select('id, user_id, partner_kind, business_name, status').eq('id', id).maybeSingle();
  if (!application || application.status !== 'submitted') redirect('/admin/partners?error=state');
  if (decision === 'approve' && application.partner_kind === 'broker') {
    const { data: office, error } = await admin.from('offices').insert({ name: application.business_name, created_by: application.user_id, verification_status: 'verified' }).select('id').single();
    if (error || !office) redirect('/admin/partners?error=save');
    const { error: memberError } = await admin.from('office_memberships').insert({ office_id: office.id, user_id: application.user_id, office_role: 'principal_broker', status: 'active' });
    if (memberError) redirect('/admin/partners?error=save');
  }
  const { error } = await admin.from('partner_applications').update({ status: decision === 'approve' ? 'approved' : 'rejected', review_note: note, reviewed_at: new Date().toISOString() }).eq('id', id).eq('status', 'submitted');
  redirect(`/admin/partners?${error ? 'error=save' : 'done=1'}`);
}
