import { beforeEach, describe, expect, it, vi } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Call = { table?: string; op: string; args: unknown[] };
const calls: Call[] = [];
const tableData: Record<string, any> = {};
const rpcData: Record<string, { data: any; error: any }> = {};
let insertResult: { data: any; error: any } = { data: { id: 'r1' }, error: null };
let deleteError: any = null;
const storageRemove = vi.fn(async () => ({ error: null }));
const signed = vi.fn(async (paths: string[]) => ({ data: paths.map((path) => ({ path, signedUrl: `https://signed.test/${path}` })), error: null }));

function query(table: string) {
  const state: { op: string } = { op: 'select' };
  const builder: any = {
    select: (...args: unknown[]) => { calls.push({ table, op: 'select', args }); return builder; },
    insert: (...args: unknown[]) => { state.op = 'insert'; calls.push({ table, op: 'insert', args }); return builder; },
    delete: () => { state.op = 'delete'; calls.push({ table, op: 'delete', args: [] }); return builder; },
    eq: (...args: unknown[]) => { calls.push({ table, op: 'eq', args }); return builder; },
    in: (...args: unknown[]) => { calls.push({ table, op: 'in', args }); return builder; },
    order: () => builder, limit: () => builder,
    single: async () => insertResult,
    maybeSingle: async () => ({ data: Array.isArray(tableData[table]) ? tableData[table][0] ?? null : tableData[table] ?? null, error: null }),
    then: (resolve: (value: unknown) => void) => resolve(state.op === 'delete' ? { error: deleteError } : state.op === 'insert' ? { error: insertResult.error } : { data: tableData[table] ?? [], error: null }),
  };
  return builder;
}
const db = {
  auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } } })) },
  from: (table: string) => query(table),
  rpc: vi.fn(async (name: string, args?: unknown) => { calls.push({ op: `rpc:${name}`, args: [args] }); return rpcData[name] ?? { data: null, error: null }; }),
  storage: { from: () => ({ createSignedUrls: signed, remove: storageRemove }) },
};
const admin = { rpc: vi.fn(async (name: string, args?: unknown) => { calls.push({ op: `admin:${name}`, args: [args] }); return rpcData[`admin:${name}`] ?? { data: 'b1', error: null }; }) };

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/features/zipsin-clean/server/db', () => ({ cleanSessionDb: async () => db, cleanAdminDb: () => admin }));
const viewer = vi.fn();
vi.mock('@/features/zipsin-clean/server/viewer', () => ({ getCleanViewer: () => viewer() }));

const actions = await import('@/features/zipsin-clean/server/actions');
const data = await import('@/features/zipsin-clean/server/data');
const { cleanErrorMessage, cleanMessage } = await import('@/features/zipsin-clean/server/errors');
const { nextDays, seoulToday } = await import('@/features/zipsin-clean/domain/schedule');

const facts = { service: 'move_in', areaPyeong: 24, rooms: 3, baths: 2, balcony: 'expanded', builtAge: 'mid', occupancy: 'just_left', pets: 'no', smoking: 'no' };
const booking = (over: Record<string, unknown> = {}) => ({
  input: facts, partnerId: '11111111-1111-4111-8111-111111111111', serviceDate: nextDays(seoulToday())[1].iso, startHour: 9, arrivalHour: 17,
  areaDistrict: '마포구 공덕동', detailAddress: '101동', contactPhone: '010-0000-0000', requests: ['아이가 살고 있어요'], memo: '', idempotencyKey: '33333333-3333-4333-8333-333333333333',
  ...over,
});

beforeEach(() => {
  calls.length = 0;
  for (const key of Object.keys(tableData)) delete tableData[key];
  for (const key of Object.keys(rpcData)) delete rpcData[key];
  insertResult = { data: { id: 'r1' }, error: null };
  deleteError = null;
  viewer.mockResolvedValue({ userId: 'u1', isOperator: false, partnerIds: [], phoneVerified: true });
});

describe('createCleanBooking — 가격은 서버가 계산', () => {
  it('TEST-CL-SRV-001 recomputes price on the server and books for the signed-in customer', async () => {
    const result = await actions.createCleanBooking({ ...booking(), priceWon: 1, p_price_won: 1 });
    expect(result).toEqual({ ok: true, value: { bookingId: 'b1' } });
    const sent = calls.find((call) => call.op === 'admin:create_clean_booking')?.args[0] as Record<string, unknown>;
    expect(sent).toMatchObject({ p_customer_id: 'u1', p_price_won: 325000, p_grade: 1, p_people: 2, p_hours: 7, p_price_table_version: 'v0-2026-10-18', p_arrival_hour: 17 });
  });

  it('TEST-CL-SRV-002 refuses signed-out, unverified, bad dates, bad schedules and bad input', async () => {
    viewer.mockResolvedValueOnce(null);
    expect(await actions.createCleanBooking(booking())).toEqual({ ok: false, error: cleanMessage('login_required') });
    viewer.mockResolvedValueOnce({ userId: 'u1', isOperator: false, partnerIds: [], phoneVerified: false });
    expect(await actions.createCleanBooking(booking())).toEqual({ ok: false, error: cleanMessage('phone_required') });
    expect(await actions.createCleanBooking(booking({ serviceDate: '2020-01-01' }))).toEqual({ ok: false, error: '날짜를 다시 골라 주세요.' });
    expect(await actions.createCleanBooking(booking({ startHour: 13, arrivalHour: 15 }))).toMatchObject({ ok: false, error: expect.stringContaining('이삿짐') });
    expect(await actions.createCleanBooking(booking({ contactPhone: '12' }))).toMatchObject({ ok: false, error: '연락처를 010-0000-0000처럼 적어 주세요.' });
    expect(await actions.createCleanBooking(booking({ startHour: 11 }))).toMatchObject({ ok: false, error: '시작 시간을 골라 주세요.' });
    expect(calls.some((call) => call.op === 'admin:create_clean_booking')).toBe(false);
  });

  it('TEST-CL-SRV-003 turns database errors into plain Korean without leaking details', async () => {
    rpcData['admin:create_clean_booking'] = { data: null, error: { message: 'partner_unavailable' } };
    expect(await actions.createCleanBooking(booking())).toEqual({ ok: false, error: cleanMessage('partner_unavailable') });
    expect(cleanErrorMessage({ message: 'relation "x" violates something', code: '42501' })).toBe(cleanMessage('permission_denied'));
    expect(cleanErrorMessage({ code: '23514' })).toBe(cleanMessage('invalid_input'));
    expect(cleanErrorMessage('boom')).toBe(cleanMessage('server_error'));
    expect(cleanMessage('nope')).toBe(cleanMessage('server_error'));
  });
});

describe('다른 서버 액션', () => {
  it('TEST-CL-SRV-004 passes booking actions through the single DB door', async () => {
    rpcData.clean_booking_action = { data: 'accepted', error: null };
    expect(await actions.cleanBookingAction({ bookingId: '11111111-1111-4111-8111-111111111111', action: 'accept' })).toEqual({ ok: true, value: { status: 'accepted' } });
    expect(calls.at(-1)?.args[0]).toMatchObject({ p_action: 'accept', p_note: null, p_consent: false });
    expect(await actions.cleanBookingAction({ bookingId: 'x', action: 'accept' })).toMatchObject({ ok: false });
    rpcData.clean_booking_action = { data: null, error: { message: 'invalid_state' } };
    expect(await actions.cleanBookingAction({ bookingId: '11111111-1111-4111-8111-111111111111', action: 'start' })).toEqual({ ok: false, error: cleanMessage('invalid_state') });
  });

  it('TEST-CL-SRV-005 saves visit requests and my-page records for the signed-in user only', async () => {
    const day = nextDays(seoulToday())[0].iso;
    expect(await actions.createCleanVisitRequest({ kind: 'special', special: ['화재·그을음'], note: '', areaDistrict: '마포구', visitDate: day, slot: '오전', contactPhone: '010-0000-0000' })).toEqual({ ok: true, value: undefined });
    expect(calls.find((call) => call.table === 'clean_visit_requests' && call.op === 'insert')?.args[0]).toMatchObject({ customer_id: 'u1', visit_date: day });
    expect(await actions.createCleanVisitRequest({ kind: 'special', special: [], note: '', areaDistrict: '마포구', visitDate: day, slot: '오전', contactPhone: '010-0000-0000' })).toEqual({ ok: false, error: '어떤 특수 청소인지 골라 주세요.' });
    expect(await actions.createCleanVisitRequest({ kind: 'tidy', special: [], note: '', areaDistrict: '마포구', visitDate: '2020-01-01', slot: '오전', contactPhone: '010-0000-0000' })).toEqual({ ok: false, error: '방문 날짜를 다시 골라 주세요.' });
    insertResult = { data: null, error: { code: '23514' } };
    expect(await actions.createCleanVisitRequest({ kind: 'tidy', special: [], note: '', areaDistrict: '마포구', visitDate: day, slot: '오전', contactPhone: '010-0000-0000' })).toEqual({ ok: false, error: cleanMessage('invalid_input') });
    insertResult = { data: { id: 'r1' }, error: null };
    expect(await actions.createCleanRecord({ month: '2025-06', service: '기타', partnerName: '이모님', areaDistrict: '마포구', priceWon: null, memo: '' })).toEqual({ ok: true, value: { recordId: 'r1' } });
    expect(calls.find((call) => call.table === 'clean_records' && call.op === 'insert')?.args[0]).toMatchObject({ owner_id: 'u1', done_month: '2025-06-01' });
    expect(await actions.createCleanRecord({ month: '', service: '기타', partnerName: '', areaDistrict: '', priceWon: null, memo: '' })).toMatchObject({ ok: false, error: '언제, 어느 업체, 어디인지 적어 주세요.' });
    viewer.mockResolvedValue(null);
    expect(await actions.createCleanVisitRequest({})).toEqual({ ok: false, error: cleanMessage('login_required') });
    expect(await actions.createCleanRecord({})).toEqual({ ok: false, error: cleanMessage('login_required') });
    expect(await actions.redeemCleanInvite('ABCDEF1234')).toEqual({ ok: false, error: cleanMessage('login_required') });
  });

  it('TEST-CL-SRV-006 deletes a record with its photos, and handles photo prepare/complete', async () => {
    tableData.clean_photos = [{ storage_path: 'u1/p.jpg' }];
    expect(await actions.deleteCleanRecord('r1')).toEqual({ ok: true, value: undefined });
    expect(storageRemove).toHaveBeenCalledWith(['u1/p.jpg']);
    deleteError = { code: '42501' };
    expect(await actions.deleteCleanRecord('r1')).toEqual({ ok: false, error: cleanMessage('permission_denied') });
    rpcData.prepare_clean_photo = { data: [{ photo_id: 'p1', storage_path: 'u1/p1.jpg' }], error: null };
    expect(await actions.prepareCleanPhoto('after', { bookingId: 'b1' })).toEqual({ ok: true, value: { photoId: 'p1', path: 'u1/p1.jpg' } });
    rpcData.prepare_clean_photo = { data: null, error: { message: 'permission_denied' } };
    expect(await actions.prepareCleanPhoto('record', { recordId: 'r1' })).toEqual({ ok: false, error: cleanMessage('permission_denied') });
    expect(await actions.completeCleanPhoto('p1')).toEqual({ ok: true, value: undefined });
    rpcData.complete_clean_photo = { data: null, error: { message: 'upload_missing' } };
    expect(await actions.completeCleanPhoto('p1')).toEqual({ ok: false, error: cleanMessage('upload_missing') });
  });

  it('TEST-CL-SRV-007 redeems invite codes and runs operator actions', async () => {
    expect(await actions.redeemCleanInvite('짧')).toEqual({ ok: false, error: cleanMessage('invite_invalid') });
    expect(await actions.redeemCleanInvite(' ABCDEF1234 ')).toEqual({ ok: true, value: undefined });
    rpcData.redeem_clean_partner_invite = { data: null, error: { message: 'invite_invalid' } };
    expect(await actions.redeemCleanInvite('ABCDEF1234')).toEqual({ ok: false, error: cleanMessage('invite_invalid') });
    rpcData.create_clean_partner = { data: 'p9', error: null };
    expect(await actions.createCleanPartner({ name: '맑은집', kind: 'company', area: '', team: '', checks: [] })).toEqual({ ok: true, value: { partnerId: 'p9' } });
    expect(await actions.createCleanPartner({ name: '', kind: 'company', area: '', team: '', checks: [] })).toEqual({ ok: false, error: '업체 이름을 적어 주세요.' });
    rpcData.create_clean_partner = { data: null, error: { message: 'permission_denied' } };
    expect(await actions.createCleanPartner({ name: 'x', kind: 'company', area: '', team: '', checks: [] })).toEqual({ ok: false, error: cleanMessage('permission_denied') });
    rpcData.create_clean_partner_invite = { data: '3F9A1C0B2D', error: null };
    expect(await actions.createCleanInvite('p1')).toEqual({ ok: true, value: { code: '3F9A1C0B2D' } });
    rpcData.create_clean_partner_invite = { data: null, error: { message: 'permission_denied' } };
    expect(await actions.createCleanInvite('p1')).toMatchObject({ ok: false });
    expect(await actions.setCleanPartnerStatus('p1', 'red_card')).toEqual({ ok: true, value: undefined });
    expect(await actions.setCleanPartnerStatus('p1', 'nope' as never)).toEqual({ ok: false, error: cleanMessage('invalid_input') });
    rpcData.set_clean_partner_status = { data: null, error: { message: 'not_found' } };
    expect(await actions.setCleanPartnerStatus('p1', 'active')).toEqual({ ok: false, error: cleanMessage('not_found') });
  });
});

describe('조회', () => {
  const row = { id: 'b1', status: 'done', service: 'move_in', facts, area_pyeong: '24.0', grade: 1, people: 2, hours: '7.0', price_won: 325000, includes: null, area_district: '마포구', service_date: '2026-10-20', start_hour: 9, arrival_hour: null, requests: null, partner_note: null, portfolio_consent: false };

  it('TEST-CL-SRV-008 attaches signed photo URLs and maps rows for customers and partners', async () => {
    tableData.clean_bookings = [{ ...row, clean_partners: { name: '초록손' }, clean_booking_private: { detail_address: '101동', memo: '메모' }, block_reason: null }];
    tableData.clean_photos = [{ id: 'p1', kind: 'after', storage_path: 'u/p1.jpg', booking_id: 'b1', record_id: null }];
    const [mine] = await data.listCustomerBookings(db as never, 'u1');
    expect(mine).toMatchObject({ id: 'b1', areaPyeong: 24, hours: 7, partnerName: '초록손', detailAddress: '101동', memo: '메모', includes: [], requests: [], photos: [{ id: 'p1', kind: 'after', url: 'https://signed.test/u/p1.jpg' }] });
    rpcData.clean_partner_jobs = { data: [{ ...row, memo: null, detail_address: null, contact_phone: null }], error: null };
    const [job] = await data.listPartnerJobs(db as never);
    expect(job).toMatchObject({ memo: '', detailAddress: null, photos: [{ id: 'p1' }] });
  });

  it('TEST-CL-SRV-009 lists partners with real completed counts and consented sample photos only', async () => {
    tableData.clean_partners = [{ id: 'p1', name: '초록손', kind: 'company', area: '마포', team: '', checks: null }, { id: 'p2', name: '반듯', kind: 'individual', area: '', team: '', checks: [] }];
    rpcData.clean_partner_stats = { data: [{ partner_id: 'p1', completed_count: 3 }], error: null };
    rpcData.clean_partner_samples = { data: [{ photo_id: 's1', partner_id: 'p1', kind: 'after', storage_path: 'u/s1.jpg' }], error: null };
    const partners = await data.listPartnerOptions(db as never);
    expect(partners[0]).toMatchObject({ completedCount: 3, checks: [], samplePhotos: [{ id: 's1', url: 'https://signed.test/u/s1.jpg' }] });
    expect(partners[1]).toMatchObject({ completedCount: 0, samplePhotos: [] });
  });

  it('TEST-CL-SRV-010 loads my records, visit requests and the operator view', async () => {
    tableData.clean_records = [{ id: 'r1', done_month: '2024-02-01', service: '기타', partner_name: '이모님', area_district: '마포', price_won: null, memo: '' }];
    tableData.clean_photos = [];
    expect(await data.listMyRecords(db as never, 'u1')).toEqual([{ id: 'r1', doneMonth: '2024-02-01', service: '기타', partnerName: '이모님', areaDistrict: '마포', priceWon: null, memo: '', photos: [] }]);
    tableData.clean_visit_requests = [{ id: 'v1', kind: 'tidy', special: null, note: '', area_district: '마포', visit_date: '2026-10-21', slot: '오전', contact_phone: '010-0000-0000', status: 'requested', created_at: 't' }];
    expect((await data.listMyVisitRequests(db as never, 'u1'))[0]).toMatchObject({ special: [], contactPhone: '010-0000-0000' });
    tableData.clean_partners = [{ id: 'p1', name: '초록손', kind: 'company', area: '', team: '', checks: null, status: 'active', clean_partner_members: [{ user_id: 'x' }] }];
    tableData.clean_bookings = [{ id: 'b1', status: 'block_reported', area_district: '마포', service_date: '2026-10-20', price_won: 1, block_reason: '기타', block_note: 'n', created_at: 't', clean_partners: null }];
    const adminData = await data.loadAdminData(db as never);
    expect(adminData.partners[0]).toMatchObject({ memberCount: 1, checks: [] });
    expect(adminData.bookings[0]).toMatchObject({ partnerName: '', blockReason: '기타' });
    expect(adminData.visits).toHaveLength(1);
  });
});
