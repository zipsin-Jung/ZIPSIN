import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createRecord, prepare, complete, storageUpload } = vi.hoisted(() => ({
  createRecord: vi.fn(), prepare: vi.fn(), complete: vi.fn(), storageUpload: vi.fn(),
}));
vi.mock('@/features/records/actions/create-record', () => ({ createRecordAction: createRecord }));
vi.mock('@/features/attachments/actions/upload', () => ({ prepareAttachmentUploadAction: prepare, completeAttachmentUploadAction: complete }));
vi.mock('@/lib/supabase/client', () => ({ createBrowserSupabaseClient: () => ({ storage: { from: () => ({ upload: storageUpload }) } }) }));
vi.mock('@/lib/media/prepare-photo', () => ({ preparePhoto: async (file: File) => ({ file, converted: true, locationRemoved: true }) }));
// 파일 이름 앞 4자리 = 10월 며칠, 5번째 글자 a/p = 오전/오후
vi.mock('@/lib/media/photo-meta', () => ({
  readPhotoMeta: async (file: File) => ({ takenAt: { year: 2026, month: 10, day: Number(file.name.slice(2, 4)), hour: file.name[4] === 'p' ? 15 : 9, minute: 0 }, gps: null }),
}));

import { BulkPhotoUploader } from '@/features/records/components/BulkPhotoUploader';

const homeA = { id: '00000000-0000-4000-8000-0000000000a1', label: '○○빌라 201호', officeId: '00000000-0000-4000-8000-0000000000f1' };
const homeB = { id: '00000000-0000-4000-8000-0000000000b1', label: '□□빌라 102호', officeId: '00000000-0000-4000-8000-0000000000f1' };
const photos = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => new File([new Uint8Array(4)], `${prefix}-${i}.jpg`, { type: 'image/jpeg' }));
const recordIds = ['00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000103'];

async function pick(container: HTMLElement, files: File[]) {
  const user = userEvent.setup();
  await user.upload(container.querySelector('input[type=file]') as HTMLInputElement, files);
  return user;
}

describe('BulkPhotoUploader — 앨범 사진 한꺼번에 올려 집별로 나누기', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prepare.mockResolvedValue({ ok: true, attachmentId: '00000000-0000-4000-8000-00000000000a', storagePath: 'p' });
    storageUpload.mockResolvedValue({ error: null });
    complete.mockResolvedValue({ ok: true });
  });

  it('TEST-BULK-UI-001 groups picked photos by date and asks which home each group belongs to', async () => {
    const { container } = render(<BulkPhotoUploader currentYear={2026} homes={[homeA, homeB]} />);
    await pick(container, [...photos('1015p', 3), ...photos('1012a', 2)]);
    expect(await screen.findByRole('heading', { name: '사진 5장 고름' })).toBeInTheDocument();
    expect(screen.getByText('10월 15일 오후 · 3장')).toBeInTheDocument();
    expect(screen.getByText('10월 12일 오전 · 2장')).toBeInTheDocument();
    expect(screen.getByText(/사진 속 위치정보는 올릴 때 지워요/)).toBeInTheDocument();
    const select = screen.getByRole('combobox', { name: '10월 15일 오후 사진의 집' });
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['고르지 않음', '○○빌라 201호', '□□빌라 102호']);
    expect(screen.getByRole('button', { name: '0장 올리기' })).toBeDisabled();
  });

  it('TEST-BULK-UI-002 uploads only groups with a home, as office-only photo records of at most 10 photos', async () => {
    createRecord.mockResolvedValueOnce({ recordId: recordIds[0] }).mockResolvedValueOnce({ recordId: recordIds[1] });
    const { container } = render(<BulkPhotoUploader currentYear={2026} homes={[homeA, homeB]} />);
    const user = await pick(container, [...photos('1015p', 12), ...photos('1012a', 2)]);
    await user.selectOptions(await screen.findByRole('combobox', { name: '10월 15일 오후 사진의 집' }), homeB.id);
    expect(screen.getByText('집을 고르지 않은 사진 2장은 올리지 않아요.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '12장 올리기' }));
    expect(await screen.findByText('사진 12장을 올렸어요.')).toBeInTheDocument();
    expect(createRecord).toHaveBeenCalledTimes(2);
    const first = createRecord.mock.calls[0][0] as FormData;
    expect(Object.fromEntries(['homeId', 'officeId', 'contractId', 'space', 'kind', 'title', 'body'].map((key) => [key, first.get(key)]))).toEqual({
      homeId: homeB.id, officeId: homeB.officeId, contractId: '', space: 'office_internal', kind: 'photo', title: '10월 15일 오후 사진 (1/2)', body: '',
    });
    expect((createRecord.mock.calls[1][0] as FormData).get('title')).toBe('10월 15일 오후 사진 (2/2)');
    expect(storageUpload).toHaveBeenCalledTimes(12);
    expect(screen.getByRole('link', { name: '기록 보러 가기' })).toHaveAttribute('href', '/records');
  });

  it('TEST-BULK-UI-003 preselects the home just registered and retries only the photos that failed, without new records', async () => {
    createRecord.mockResolvedValueOnce({ recordId: recordIds[0] });
    storageUpload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { message: 'network' } }).mockResolvedValue({ error: null });
    const { container } = render(<BulkPhotoUploader currentYear={2026} homes={[homeA, homeB]} initialHomeId={homeA.id} />);
    const user = await pick(container, photos('1015p', 3));
    await user.click(await screen.findByRole('button', { name: '3장 올리기' }));
    expect(await screen.findByText('사진 1장을 올리지 못했어요. 다른 사진은 저장했어요.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '못 올린 1장 다시 올리기' }));
    expect(await screen.findByText('사진 3장을 올렸어요.')).toBeInTheDocument();
    expect(createRecord).toHaveBeenCalledTimes(1);
    expect(storageUpload).toHaveBeenCalledTimes(4);
  });

  it('TEST-BULK-UI-004 when a record could not be made, retry reuses the same request key so no duplicate record appears', async () => {
    createRecord.mockResolvedValueOnce({ error: '잠시 후 다시 시도해 주세요.' }).mockResolvedValueOnce({ recordId: recordIds[0] });
    const { container } = render(<BulkPhotoUploader currentYear={2026} homes={[homeA]} />);
    const user = await pick(container, photos('1015p', 2));
    await user.click(await screen.findByRole('button', { name: '2장 올리기' }));
    expect(await screen.findByText('사진 2장을 올리지 못했어요. 다른 사진은 저장했어요.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '못 올린 2장 다시 올리기' }));
    expect(await screen.findByText('사진 2장을 올렸어요.')).toBeInTheDocument();
    const keys = createRecord.mock.calls.map((call) => (call[0] as FormData).get('idempotencyKey'));
    expect(keys[0]).toBe(keys[1]);
    expect(storageUpload).toHaveBeenCalledTimes(2);
  });

  it('TEST-BULK-UI-005 refuses more than 100 photos at once and lets the user pick again', async () => {
    const { container } = render(<BulkPhotoUploader currentYear={2026} homes={[homeA]} />);
    await pick(container, photos('1015p', 101));
    expect(await screen.findByRole('alert')).toHaveTextContent('한 번에 100장까지 골라 주세요.');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('TEST-BULK-UI-006 shows an empty state when there is no home to put photos in', () => {
    render(<BulkPhotoUploader currentYear={2026} homes={[]} />);
    expect(screen.getByText('사진을 올릴 집이 아직 없어요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '집 등록하기' })).toHaveAttribute('href', '/homes/new');
    expect(screen.queryByLabelText('앨범에서 사진 고르기')).not.toBeInTheDocument();
  });

  it('TEST-BULK-UI-008 previews up to 6 real photos per group on the phone and frees them when leaving', async () => {
    const create = vi.fn((file: File) => `blob:${file.name}`);
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const { container, unmount } = render(<BulkPhotoUploader currentYear={2026} homes={[homeA]} />);
    await pick(container, photos('1015p', 8));
    await screen.findByText('10월 15일 오후 · 8장');
    expect(container.querySelectorAll('img')).toHaveLength(6);
    expect(screen.getByText('외 2장')).toBeInTheDocument();
    unmount();
    expect(revoke).toHaveBeenCalledTimes(6);
    Object.assign(URL, { createObjectURL: undefined, revokeObjectURL: undefined });
  });

  it('TEST-BULK-UI-007 tells the user when some photos were sent with their original data', async () => {
    createRecord.mockResolvedValueOnce({ recordId: recordIds[0] });
    const { container } = render(<BulkPhotoUploader currentYear={2026} homes={[homeA]} prepare={async (file) => ({ file, converted: false, locationRemoved: false })} />);
    const user = await pick(container, photos('1015p', 1));
    await user.click(await screen.findByRole('button', { name: '1장 올리기' }));
    expect(await screen.findByText('이 브라우저에서 열 수 없는 사진 1장은 원본 그대로 올렸어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('사진 1장을 올렸어요.')).toBeInTheDocument());
  });
});
