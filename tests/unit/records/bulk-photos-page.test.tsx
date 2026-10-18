import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;
const { tables, calls } = vi.hoisted(() => ({ tables: {} as Record<string, { data: Row[] | null; error: unknown }>, calls: [] as Array<{ table: string; method: string; args: unknown[] }> }));

function chain(table: string) {
  const result = () => tables[table] ?? { data: [], error: null };
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'is', 'lte', 'in', 'order']) {
    builder[method] = (...args: unknown[]) => { calls.push({ table, method, args }); return builder; };
  }
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve);
  return builder;
}
vi.mock('@/features/auth/guards/require-onboarding', () => ({
  requireOnboardingComplete: async () => ({ user: { id: 'user-1' }, supabase: { from: (table: string) => chain(table) } }),
}));
vi.mock('@/features/records/components/BulkPhotoUploader', () => ({
  BulkPhotoUploader: ({ homes, initialHomeId }: { homes: Array<{ id: string; label: string; officeId: string }>; initialHomeId: string | null }) => (
    <div data-testid="uploader" data-initial={initialHomeId ?? ''}>{homes.map((home) => `${home.label}|${home.officeId}`).join(',')}</div>
  ),
}));

import BulkPhotosPage from '@/app/(app)/records/bulk/page';

const homeId = '00000000-0000-4000-8000-0000000000a1';

describe('/records/bulk — 사진 한꺼번에 올리기 페이지', () => {
  beforeEach(() => { calls.length = 0; for (const key of Object.keys(tables)) delete tables[key]; });

  it('TEST-BULK-PAGE-001 offers only homes of offices where the user is an active broker or assistant', async () => {
    tables.office_memberships = { data: [{ office_id: 'office-1', office_role: 'principal_broker' }, { office_id: 'office-2', office_role: 'landlord' }], error: null };
    tables.homes = { data: [{ id: homeId, office_id: 'office-1', home_label: null, address_line1: '서울 노원구 공릉로 10', address_detail: '201호' }], error: null };
    render(await BulkPhotosPage({ searchParams: Promise.resolve({ homeId }) }));
    expect(screen.getByTestId('uploader')).toHaveTextContent('서울 노원구 공릉로 10 201호|office-1');
    expect(screen.getByTestId('uploader')).toHaveAttribute('data-initial', homeId);
    expect(calls).toContainEqual({ table: 'homes', method: 'in', args: ['office_id', ['office-1']] });
    expect(calls).toContainEqual({ table: 'office_memberships', method: 'is', args: ['ended_at', null] });
    expect(screen.getByRole('link', { name: '닫기' })).toHaveAttribute('href', `/homes/${homeId}`);
  });

  it('TEST-BULK-PAGE-002 ignores a malformed home id and shows no homes to people outside any office', async () => {
    tables.office_memberships = { data: [], error: null };
    render(await BulkPhotosPage({ searchParams: Promise.resolve({ homeId: 'not-a-uuid' }) }));
    expect(screen.getByTestId('uploader')).toHaveTextContent('');
    expect(screen.getByTestId('uploader')).toHaveAttribute('data-initial', '');
    expect(calls.some((call) => call.table === 'homes')).toBe(false);
    expect(screen.getByRole('link', { name: '닫기' })).toHaveAttribute('href', '/records');
  });

  it('TEST-BULK-PAGE-003 shows an error instead of an empty list when loading fails', async () => {
    tables.office_memberships = { data: null, error: { message: 'down' } };
    render(await BulkPhotosPage({}));
    expect(screen.getByRole('alert')).toHaveTextContent('집 목록을 불러오지 못했어요.');
  });
});
