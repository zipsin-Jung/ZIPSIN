import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
const fake = vi.hoisted(() => ({
  user: { id: 'u1' } as { id: string } | null,
  operator: null as unknown,
  members: [] as Array<{ partner_id: string }>,
  profile: { phone_verified_at: '2026-10-01' } as unknown,
  upload: vi.fn(async () => ({ error: null as unknown })),
  prepare: vi.fn(async () => ({ ok: true, value: { photoId: 'p1', path: 'u1/p1.jpg' } }) as any),
  complete: vi.fn(async () => ({ ok: true, value: undefined }) as any),
  preparePhoto: vi.fn(async () => new Blob(['x'], { type: 'image/jpeg' })),
  push: vi.fn(), refresh: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: fake.user } }) },
    from: (table: string) => {
      const chain: any = { select: () => chain, eq: () => chain };
      chain.maybeSingle = async () => ({ data: table === 'clean_operators' ? fake.operator : fake.profile });
      chain.then = (resolve: (value: unknown) => void) => resolve({ data: fake.members });
      return chain;
    },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ admin: true }) }));
vi.mock('@/lib/supabase/client', () => ({ createBrowserSupabaseClient: () => ({ storage: { from: () => ({ upload: fake.upload }) } }) }));
vi.mock('@/lib/zipsin-check/photo-store', () => ({ preparePhoto: fake.preparePhoto }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: fake.push, refresh: fake.refresh }) }));
vi.mock('@/features/zipsin-clean/server/actions', () => ({
  prepareCleanPhoto: fake.prepare, completeCleanPhoto: fake.complete,
  createCleanBooking: vi.fn(), createCleanVisitRequest: vi.fn(), cleanBookingAction: vi.fn(), createCleanRecord: vi.fn(), deleteCleanRecord: vi.fn(),
  redeemCleanInvite: vi.fn(), createCleanPartner: vi.fn(), createCleanInvite: vi.fn(), setCleanPartnerStatus: vi.fn(),
}));

const { getCleanViewer } = await import('@/features/zipsin-clean/server/viewer');
const { cleanAdminDb, cleanSessionDb } = await import('@/features/zipsin-clean/server/db');
const { uploadCleanPhotos } = await import('@/features/zipsin-clean/client/upload-photo');
const { cleanLinks } = await import('@/features/zipsin-clean/server/nav');
const { cleanOpenNow } = await import('@/features/zipsin-clean/server/open');
const { CleanShell } = await import('@/features/zipsin-clean/components/CleanShell');
const { PhotoStrip } = await import('@/features/zipsin-clean/components/PhotoStrip');
const connected = await import('@/features/zipsin-clean/components/connected');

afterEach(() => { vi.unstubAllEnvs(); fake.user = { id: 'u1' }; fake.operator = null; fake.members = []; fake.profile = { phone_verified_at: '2026-10-01' }; });
const file = () => new File(['x'], 'a.jpg', { type: 'image/jpeg' });

describe('누가 보는지', () => {
  it('TEST-CL-WIRE-001 knows signed-out, customer, partner and operator viewers', async () => {
    fake.user = null;
    expect(await getCleanViewer()).toBeNull();
    fake.user = { id: 'u1' };
    fake.profile = null;
    expect(await getCleanViewer()).toEqual({ userId: 'u1', isOperator: false, partnerIds: [], phoneVerified: false });
    fake.operator = { user_id: 'u1' };
    fake.members = [{ partner_id: 'p1' }];
    fake.profile = { phone_verified_at: 'x' };
    expect(await getCleanViewer()).toEqual({ userId: 'u1', isOperator: true, partnerIds: ['p1'], phoneVerified: true });
    expect(await cleanSessionDb()).toBeTruthy();
    expect(cleanAdminDb()).toEqual({ admin: true });
  });

  it('TEST-CL-WIRE-002 builds the menu for each viewer', () => {
    expect(cleanLinks(null, '/cl/my').map((link) => link.label)).toEqual(['청소 예약', '로그인']);
    expect(cleanLinks(null, '/cl/my')[1].href).toBe('/login?next=%2Fcl%2Fmy');
    const operator = cleanLinks({ userId: 'u', isOperator: true, partnerIds: [], phoneVerified: true }, '/cl/admin');
    expect(operator.map((link) => link.label)).toEqual(['청소 예약', '마이페이지', '업체', '관리']);
    expect(operator.find((link) => link.current)?.href).toBe('/cl/admin');
    render(<CleanShell links={operator}><p>본문</p></CleanShell>);
    expect(screen.getByRole('link', { name: '관리' })).toHaveAttribute('aria-current', 'page');
  });

  it('TEST-CL-WIRE-003 opens only when login is open, and on production only with the launch flag', () => {
    vi.stubEnv('NEXT_PUBLIC_ACCOUNT_OPEN', 'true');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_CLEAN_OPEN', '');
    expect(cleanOpenNow()).toBe(false);
    vi.stubEnv('NEXT_PUBLIC_CLEAN_OPEN', 'true');
    expect(cleanOpenNow()).toBe(true);
    vi.stubEnv('NEXT_PUBLIC_ACCOUNT_OPEN', 'false');
    expect(cleanOpenNow()).toBe(false);
  });
});

describe('사진 올리기', () => {
  it('TEST-CL-WIRE-004 re-encodes, prepares, uploads, completes — and reports each failure in plain words', async () => {
    expect(await uploadCleanPhotos({ kind: 'after', bookingId: 'b1' }, [file()])).toBeNull();
    expect(fake.upload).toHaveBeenCalledWith('u1/p1.jpg', expect.any(Blob), { contentType: 'image/jpeg', upsert: false });
    fake.preparePhoto.mockRejectedValueOnce(new Error('JPG, PNG, WebP 사진만 저장할 수 있어요.'));
    expect(await uploadCleanPhotos({ kind: 'after', bookingId: 'b1' }, [file()])).toBe('JPG, PNG, WebP 사진만 저장할 수 있어요.');
    fake.preparePhoto.mockRejectedValueOnce('x');
    expect(await uploadCleanPhotos({ kind: 'after', bookingId: 'b1' }, [file()])).toBe('사진을 처리하지 못했어요.');
    fake.prepare.mockResolvedValueOnce({ ok: false, error: '이 작업을 할 수 있는 계정이 아니에요.' });
    expect(await uploadCleanPhotos({ kind: 'record', recordId: 'r1' }, [file()])).toBe('이 작업을 할 수 있는 계정이 아니에요.');
    fake.upload.mockResolvedValueOnce({ error: { message: 'x' } });
    expect(await uploadCleanPhotos({ kind: 'after', bookingId: 'b1' }, [file()])).toMatch(/인터넷 연결/);
    fake.complete.mockResolvedValueOnce({ ok: false, error: '사진이 다 올라가지 않았어요. 다시 올려 주세요.' });
    expect(await uploadCleanPhotos({ kind: 'after', bookingId: 'b1' }, [file()])).toBe('사진이 다 올라가지 않았어요. 다시 올려 주세요.');
  });

  it('TEST-CL-WIRE-005 photo list shows upload errors and ignores an empty pick', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn(async () => '사진은 30장까지 올릴 수 있어요.');
    render(<PhotoStrip onAdd={onAdd} photos={[]} />);
    await user.upload(screen.getByLabelText('사진 추가'), file());
    expect(await screen.findByRole('alert')).toHaveTextContent('30장까지');
    await user.upload(screen.getByLabelText('사진 추가'), []);
    expect(onAdd).toHaveBeenCalledOnce();
  });
});

describe('연결 부품', () => {
  it('TEST-CL-WIRE-006 connected screens render with server data', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<connected.ConnectedBooking partners={[]} phoneVerified signedIn />);
    expect(screen.getByRole('button', { name: '가격 보기' })).toBeInTheDocument();
    unmount();
    const my = render(<connected.ConnectedMyPage bookings={[]} records={[]} visits={[]} />);
    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument();
    my.unmount();
    const partner = render(<connected.ConnectedPartner jobs={[]} partnerName={null} />);
    expect(screen.getByRole('heading', { name: '집신이 초대한 업체만 들어와요' })).toBeInTheDocument();
    partner.unmount();
    render(<connected.ConnectedAdmin bookings={[]} partners={[]} visits={[]} />);
    await user.click(screen.getByRole('tab', { name: '예약 0' }));
    expect(screen.getByText('아직 예약이 없어요.')).toBeInTheDocument();
  });
});

describe('cl.zipsin.net 주소', () => {
  it('TEST-CL-WIRE-007 keeps the preparing screen until launch, then sends cl.zipsin.net to /cl and other paths to zipsin.net', async () => {
    const { proxy } = await import('@/proxy');
    const request = (url: string) => new NextRequest(url, { headers: { host: new URL(url).host } });
    vi.stubEnv('NEXT_PUBLIC_ACCOUNT_OPEN', 'true');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_CLEAN_OPEN', '');
    expect((await proxy(request('https://cl.zipsin.net/cl/my'))).headers.get('location')).toBe('https://cl.zipsin.net/');
    vi.stubEnv('NEXT_PUBLIC_CLEAN_OPEN', 'true');
    expect((await proxy(request('https://cl.zipsin.net/'))).headers.get('location')).toBe('https://cl.zipsin.net/cl');
    expect((await proxy(request('https://cl.zipsin.net/login?next=%2Fcl'))).headers.get('location')).toBe('https://zipsin.net/login?next=%2Fcl');
  });
});

describe('DB 설계 지키기 (migration 글자 검사)', () => {
  const dir = path.resolve(import.meta.dirname, '../../../supabase/migrations');
  const sql = readdirSync(dir).filter((name) => name.includes('zipsin_cleaning')).map((name) => readFileSync(path.join(dir, name), 'utf8')).join('\n');

  it('TEST-CL-DBS-001 only the server can create bookings, and nobody can update a booking row directly', () => {
    expect(sql).toMatch(/grant execute on function public\.create_clean_booking\([^)]*\) to service_role;/);
    expect(sql).not.toMatch(/grant execute on function public\.create_clean_booking\([^)]*\) to authenticated/);
    expect(sql).not.toMatch(/grant [^;]*update[^;]* on public\.clean_bookings/i);
    expect(sql).not.toMatch(/price_won\s*=/);
  });

  it('TEST-CL-DBS-002 partners never read the booking tables directly and photos stay private', () => {
    expect(sql).toMatch(/create policy clean_bookings_read on public\.clean_bookings for select using \(customer_id = auth\.uid\(\) or public\.is_clean_operator\(\)\)/);
    expect(sql).toMatch(/values \('clean-photos', 'clean-photos', false/);
    expect(sql).toMatch(/when b\.status in \('accepted', 'working', 'done', 'redo', 'block_reported'\) then p\.detail_address end/);
  });
});
