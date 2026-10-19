import 'server-only';
import type { CleanDb } from '@/features/zipsin-clean/server/db';
import type { AdminBooking, AdminPartner, CleanPhoto, CustomerBooking, MyRecord, PartnerJob, PartnerOption, VisitRequest } from '@/features/zipsin-clean/domain/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

/** 사진 행에 5분짜리 서명 주소를 붙인다. 권한이 없으면 저장소가 주소를 주지 않는다(null). */
async function withUrls(db: CleanDb, rows: Row[]): Promise<Map<string, CleanPhoto[]>> {
  const byOwner = new Map<string, CleanPhoto[]>();
  if (rows.length === 0) return byOwner;
  const { data } = await db.storage.from('clean-photos').createSignedUrls(rows.map((row) => row.storage_path), 300);
  const urlByPath = new Map((data ?? []).map((item: Row) => [item.path, item.signedUrl ?? null]));
  for (const row of rows) {
    const key = row.booking_id ?? row.record_id;
    const list = byOwner.get(key) ?? [];
    list.push({ id: row.id, kind: row.kind, url: urlByPath.get(row.storage_path) ?? null });
    byOwner.set(key, list);
  }
  return byOwner;
}

async function photosFor(db: CleanDb, column: 'booking_id' | 'record_id', ids: string[]) {
  if (ids.length === 0) return new Map<string, CleanPhoto[]>();
  const { data } = await db.from('clean_photos').select('id, kind, storage_path, booking_id, record_id').in(column, ids).eq('status', 'ready').order('created_at');
  return withUrls(db, data ?? []);
}

const base = (row: Row) => ({
  id: row.id, status: row.status, service: row.service, facts: row.facts, areaPyeong: Number(row.area_pyeong), grade: row.grade, people: row.people,
  hours: Number(row.hours), priceWon: row.price_won, includes: row.includes ?? [], areaDistrict: row.area_district, serviceDate: row.service_date,
  startHour: row.start_hour, arrivalHour: row.arrival_hour, requests: row.requests ?? [], partnerNote: row.partner_note, portfolioConsent: row.portfolio_consent,
});

/** 손님이 고를 수 있는 업체(정지·퇴출된 업체는 DB가 빼 준다)와 실제 완료 건수, 공개 동의된 사진 몇 장. */
export async function listPartnerOptions(db: CleanDb): Promise<PartnerOption[]> {
  const [{ data: partners }, { data: stats }, { data: samples }] = await Promise.all([
    db.from('clean_partners').select('id, name, kind, area, team, checks').eq('status', 'active').order('created_at'),
    db.rpc('clean_partner_stats'),
    db.rpc('clean_partner_samples'),
  ]);
  const counts = new Map<string, number>((stats ?? []).map((row: Row) => [row.partner_id, row.completed_count]));
  const sampleRows: Row[] = (samples ?? []).map((row: Row) => ({ id: row.photo_id, kind: row.kind, storage_path: row.storage_path, booking_id: row.partner_id }));
  const photos = await withUrls(db, sampleRows);
  return (partners ?? []).map((row: Row) => ({ id: row.id, name: row.name, kind: row.kind, area: row.area, team: row.team, checks: row.checks ?? [], completedCount: counts.get(row.id) ?? 0, samplePhotos: photos.get(row.id) ?? [] }));
}

export async function listCustomerBookings(db: CleanDb, userId: string): Promise<CustomerBooking[]> {
  const { data } = await db.from('clean_bookings')
    .select('*, clean_partners(name), clean_booking_private(detail_address, memo)')
    .eq('customer_id', userId).order('service_date', { ascending: false });
  const rows = data ?? [];
  const photos = await photosFor(db, 'booking_id', rows.map((row: Row) => row.id));
  return rows.map((row: Row) => ({
    ...base(row), partnerName: row.clean_partners?.name ?? '', detailAddress: row.clean_booking_private?.detail_address ?? '',
    memo: row.clean_booking_private?.memo ?? '', blockReason: row.block_reason, photos: photos.get(row.id) ?? [],
  }));
}

export async function listPartnerJobs(db: CleanDb): Promise<PartnerJob[]> {
  const { data } = await db.rpc('clean_partner_jobs');
  const rows: Row[] = data ?? [];
  const photos = await photosFor(db, 'booking_id', rows.map((row) => row.id));
  return rows.map((row) => ({ ...base(row), memo: row.memo ?? '', detailAddress: row.detail_address, contactPhone: row.contact_phone, photos: photos.get(row.id) ?? [] }));
}

export async function listMyRecords(db: CleanDb, userId: string): Promise<MyRecord[]> {
  const { data } = await db.from('clean_records').select('*').eq('owner_id', userId).order('done_month', { ascending: false });
  const rows = data ?? [];
  const photos = await photosFor(db, 'record_id', rows.map((row: Row) => row.id));
  return rows.map((row: Row) => ({ id: row.id, doneMonth: row.done_month, service: row.service, partnerName: row.partner_name, areaDistrict: row.area_district, priceWon: row.price_won, memo: row.memo, photos: photos.get(row.id) ?? [] }));
}

const visit = (row: Row): VisitRequest => ({ id: row.id, kind: row.kind, special: row.special ?? [], note: row.note, areaDistrict: row.area_district, visitDate: row.visit_date, slot: row.slot, contactPhone: row.contact_phone, status: row.status, createdAt: row.created_at });

export async function listMyVisitRequests(db: CleanDb, userId: string): Promise<VisitRequest[]> {
  const { data } = await db.from('clean_visit_requests').select('*').eq('customer_id', userId).order('created_at', { ascending: false });
  return (data ?? []).map(visit);
}

export async function loadAdminData(db: CleanDb): Promise<{ partners: AdminPartner[]; bookings: AdminBooking[]; visits: VisitRequest[] }> {
  const [{ data: partners }, { data: bookings }, { data: visits }] = await Promise.all([
    db.from('clean_partners').select('*, clean_partner_members(user_id)').order('created_at'),
    db.from('clean_bookings').select('id, status, area_district, service_date, price_won, block_reason, block_note, created_at, clean_partners(name)').order('created_at', { ascending: false }).limit(200),
    db.from('clean_visit_requests').select('*').order('created_at', { ascending: false }).limit(200),
  ]);
  return {
    partners: (partners ?? []).map((row: Row) => ({ id: row.id, name: row.name, kind: row.kind, area: row.area, team: row.team, checks: row.checks ?? [], status: row.status, memberCount: (row.clean_partner_members ?? []).length })),
    bookings: (bookings ?? []).map((row: Row) => ({ id: row.id, status: row.status, partnerName: row.clean_partners?.name ?? '', areaDistrict: row.area_district, serviceDate: row.service_date, priceWon: row.price_won, blockReason: row.block_reason, blockNote: row.block_note, createdAt: row.created_at })),
    visits: (visits ?? []).map(visit),
  };
}
