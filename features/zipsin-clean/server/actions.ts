'use server';

import { revalidatePath } from 'next/cache';
import { quote } from '@/features/zipsin-clean/domain/pricing';
import { PRICE_TABLE_VERSION } from '@/features/zipsin-clean/domain/price-table';
import { checkSchedule, nextDays, seoulToday } from '@/features/zipsin-clean/domain/schedule';
import { bookingActionSchema, bookingSchema, partnerSchema, recordSchema, visitSchema } from '@/features/zipsin-clean/schemas/booking';
import { cleanAdminDb, cleanSessionDb } from '@/features/zipsin-clean/server/db';
import { cleanErrorMessage, cleanMessage } from '@/features/zipsin-clean/server/errors';
import { getCleanViewer } from '@/features/zipsin-clean/server/viewer';

export type ActionResult<T = undefined> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const firstIssue = (issues: Array<{ message: string }>) => issues[0]?.message || cleanMessage('invalid_input');
const refreshAll = () => { revalidatePath('/cl'); revalidatePath('/cl/my'); revalidatePath('/cl/partner'); revalidatePath('/cl/admin'); };

/** 예약 만들기. 가격·등급·인원·시간은 서버가 다시 계산한다(브라우저가 보낸 값은 쓰지 않는다). */
export async function createCleanBooking(raw: unknown): Promise<ActionResult<{ bookingId: string }>> {
  const viewer = await getCleanViewer();
  if (!viewer) return fail(cleanMessage('login_required'));
  if (!viewer.phoneVerified) return fail(cleanMessage('phone_required'));
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const value = parsed.data;
  if (!nextDays(seoulToday()).some((day) => day.iso === value.serviceDate)) return fail('날짜를 다시 골라 주세요.');
  let result;
  try { result = quote(value.input); } catch (error) { return fail(error instanceof Error ? error.message : cleanMessage('invalid_input')); }
  if (!checkSchedule(value.startHour, result.hours, value.arrivalHour).ok) return fail('이삿짐이 들어오기 전에 끝나는 시작 시간을 골라 주세요.');

  const { data, error } = await cleanAdminDb().rpc('create_clean_booking', {
    p_customer_id: viewer.userId, p_partner_id: value.partnerId, p_service: value.input.service, p_facts: value.input,
    p_area_pyeong: value.input.areaPyeong, p_grade: result.grade, p_people: result.people, p_hours: result.hours, p_price_won: result.priceWon,
    p_price_table_version: PRICE_TABLE_VERSION, p_includes: result.includes, p_area_district: value.areaDistrict, p_service_date: value.serviceDate,
    p_start_hour: value.startHour, p_arrival_hour: value.arrivalHour, p_requests: value.requests, p_detail_address: value.detailAddress,
    p_contact_phone: value.contactPhone, p_memo: value.memo, p_idempotency_key: value.idempotencyKey,
  });
  if (error || typeof data !== 'string') return fail(cleanErrorMessage(error));
  refreshAll();
  return { ok: true, value: { bookingId: data } };
}

/** 상태 바꾸기(손님 취소·검수, 업체 수락·시작·끝·신고, 운영자 확인). 권한은 DB가 다시 확인한다. */
export async function cleanBookingAction(raw: unknown): Promise<ActionResult<{ status: string }>> {
  const parsed = bookingActionSchema.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const value = parsed.data;
  const db = await cleanSessionDb();
  const { data, error } = await db.rpc('clean_booking_action', {
    p_booking_id: value.bookingId, p_action: value.action, p_note: value.note ?? null, p_reason: value.reason ?? null,
    p_answers: value.answers ?? null, p_consent: value.consent ?? false,
  });
  if (error || typeof data !== 'string') return fail(cleanErrorMessage(error));
  refreshAll();
  return { ok: true, value: { status: data } };
}

export async function createCleanVisitRequest(raw: unknown): Promise<ActionResult> {
  const viewer = await getCleanViewer();
  if (!viewer) return fail(cleanMessage('login_required'));
  const parsed = visitSchema.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const value = parsed.data;
  if (!nextDays(seoulToday()).some((day) => day.iso === value.visitDate)) return fail('방문 날짜를 다시 골라 주세요.');
  const db = await cleanSessionDb();
  const { error } = await db.from('clean_visit_requests').insert({
    customer_id: viewer.userId, kind: value.kind, special: value.special, note: value.note, area_district: value.areaDistrict,
    visit_date: value.visitDate, slot: value.slot, contact_phone: value.contactPhone,
  });
  if (error) return fail(cleanErrorMessage(error));
  refreshAll();
  return { ok: true, value: undefined };
}

export async function createCleanRecord(raw: unknown): Promise<ActionResult<{ recordId: string }>> {
  const viewer = await getCleanViewer();
  if (!viewer) return fail(cleanMessage('login_required'));
  const parsed = recordSchema.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const value = parsed.data;
  const db = await cleanSessionDb();
  const { data, error } = await db.from('clean_records').insert({
    owner_id: viewer.userId, done_month: `${value.month}-01`, service: value.service, partner_name: value.partnerName,
    area_district: value.areaDistrict, price_won: value.priceWon, memo: value.memo,
  }).select('id').single();
  if (error || !data) return fail(cleanErrorMessage(error));
  refreshAll();
  return { ok: true, value: { recordId: data.id as string } };
}

export async function deleteCleanRecord(recordId: string): Promise<ActionResult> {
  const db = await cleanSessionDb();
  const { data: photos } = await db.from('clean_photos').select('storage_path').eq('record_id', recordId);
  const { error } = await db.from('clean_records').delete().eq('id', recordId);
  if (error) return fail(cleanErrorMessage(error));
  const paths = (photos ?? []).map((row: { storage_path: string }) => row.storage_path);
  if (paths.length) await db.storage.from('clean-photos').remove(paths);
  refreshAll();
  return { ok: true, value: undefined };
}

/** 사진 올리기 1단계: 권한 확인 + 경로 받기. 2단계는 브라우저가 저장소에 직접 올린다. */
export async function prepareCleanPhoto(kind: 'before' | 'after' | 'block' | 'record', target: { bookingId?: string; recordId?: string }): Promise<ActionResult<{ photoId: string; path: string }>> {
  const db = await cleanSessionDb();
  const { data, error } = await db.rpc('prepare_clean_photo', { p_kind: kind, p_booking_id: target.bookingId ?? null, p_record_id: target.recordId ?? null });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return fail(cleanErrorMessage(error));
  return { ok: true, value: { photoId: row.photo_id, path: row.storage_path } };
}

/** 사진 올리기 3단계: 저장소에 파일이 있으면 보이게 한다. */
export async function completeCleanPhoto(photoId: string): Promise<ActionResult> {
  const db = await cleanSessionDb();
  const { error } = await db.rpc('complete_clean_photo', { p_photo_id: photoId });
  if (error) return fail(cleanErrorMessage(error));
  refreshAll();
  return { ok: true, value: undefined };
}

export async function redeemCleanInvite(code: string): Promise<ActionResult> {
  const viewer = await getCleanViewer();
  if (!viewer) return fail(cleanMessage('login_required'));
  const trimmed = code.trim();
  if (!/^[0-9a-zA-Z]{6,20}$/.test(trimmed)) return fail(cleanMessage('invite_invalid'));
  const db = await cleanSessionDb();
  const { error } = await db.rpc('redeem_clean_partner_invite', { p_code: trimmed });
  if (error) return fail(cleanErrorMessage(error));
  refreshAll();
  return { ok: true, value: undefined };
}

// ── 운영자 ──────────────────────────────────────────────────────────
export async function createCleanPartner(raw: unknown): Promise<ActionResult<{ partnerId: string }>> {
  const parsed = partnerSchema.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error.issues));
  const value = parsed.data;
  const db = await cleanSessionDb();
  const { data, error } = await db.rpc('create_clean_partner', { p_name: value.name, p_kind: value.kind, p_area: value.area, p_team: value.team, p_checks: value.checks });
  if (error || typeof data !== 'string') return fail(cleanErrorMessage(error));
  refreshAll();
  return { ok: true, value: { partnerId: data } };
}

/** 초대 코드는 이 응답에서 한 번만 보인다. DB에는 해시만 남는다. */
export async function createCleanInvite(partnerId: string): Promise<ActionResult<{ code: string }>> {
  const db = await cleanSessionDb();
  const { data, error } = await db.rpc('create_clean_partner_invite', { p_partner_id: partnerId });
  if (error || typeof data !== 'string') return fail(cleanErrorMessage(error));
  return { ok: true, value: { code: data } };
}

export async function setCleanPartnerStatus(partnerId: string, status: 'active' | 'suspended' | 'red_card'): Promise<ActionResult> {
  if (!['active', 'suspended', 'red_card'].includes(status)) return fail(cleanMessage('invalid_input'));
  const db = await cleanSessionDb();
  const { error } = await db.rpc('set_clean_partner_status', { p_partner_id: partnerId, p_status: status });
  if (error) return fail(cleanErrorMessage(error));
  refreshAll();
  return { ok: true, value: undefined };
}
