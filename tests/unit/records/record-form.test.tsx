import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createRecord, push, prepare, complete, storageUpload } = vi.hoisted(() => ({
  createRecord: vi.fn(), push: vi.fn(), prepare: vi.fn(), complete: vi.fn(), storageUpload: vi.fn(),
}));
vi.mock('@/features/records/actions/create-record', () => ({ createRecordAction: createRecord }));
vi.mock('@/features/attachments/actions/upload', () => ({ prepareAttachmentUploadAction: prepare, completeAttachmentUploadAction: complete }));
vi.mock('@/lib/supabase/client', () => ({ createBrowserSupabaseClient: () => ({ storage: { from: () => ({ upload: storageUpload }) } }) }));
vi.mock('@/lib/media/prepare-photo', () => ({ preparePhoto: async (file: File) => ({ file, converted: false, locationRemoved: true }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import { RecordForm } from '@/features/records/components/RecordForm';

const props = {
  homeId: '00000000-0000-4000-8000-000000000001',
  officeId: '00000000-0000-4000-8000-000000000002',
  idempotencyKey: '00000000-0000-4000-8000-000000000003',
};
const recordId = '00000000-0000-4000-8000-000000000009';
const photo = (name: string) => new File([new Uint8Array(10)], name, { type: 'image/jpeg' });

describe('RecordForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves a memo without photos as a note in the office space and returns to the home', async () => {
    createRecord.mockResolvedValueOnce({ recordId, redirectTo: `/homes/${props.homeId}` });
    const user = userEvent.setup();
    render(<RecordForm {...props} />);
    await user.type(screen.getByLabelText('제목'), '첫 기록');
    await user.click(screen.getByRole('button', { name: '집 기록에 남기기' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/homes/${props.homeId}`));
    const sent = createRecord.mock.calls[0][0] as FormData;
    expect(sent.get('kind')).toBe('note');
    expect(sent.get('space')).toBe('office_internal');
    expect(sent.get('officeId')).toBe(props.officeId);
    expect(sent.get('contractId')).toBe('');
  });

  it('TEST-REC-UP-001 creates a photo record, uploads each photo, and lets only failed photos be retried', async () => {
    createRecord.mockResolvedValueOnce({ recordId });
    prepare.mockResolvedValue({ ok: true, attachmentId: '00000000-0000-4000-8000-00000000000a', storagePath: 'p' });
    storageUpload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { message: 'network' } }).mockResolvedValueOnce({ error: null });
    complete.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    const { container } = render(<RecordForm {...props} />);
    await user.upload(container.querySelector('input[type=file]') as HTMLInputElement, [photo('a.jpg'), photo('b.jpg')]);
    await user.type(screen.getByLabelText('제목'), '입주 사진');
    await user.click(screen.getByRole('button', { name: '집 기록에 남기기' }));
    expect(await screen.findByText('기록은 저장했어요. 사진 1개만 다시 올려 주세요.')).toBeInTheDocument();
    expect((createRecord.mock.calls[0][0] as FormData).get('kind')).toBe('photo');
    expect(push).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '실패한 사진 1개 다시 올리기' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/homes/${props.homeId}`));
    expect(createRecord).toHaveBeenCalledTimes(1);
    expect(storageUpload).toHaveBeenCalledTimes(3);
  });

  it('TEST-REC-SPACE-001 shares a repair with the current contract parties only when a contract exists', async () => {
    createRecord.mockResolvedValueOnce({ recordId });
    const user = userEvent.setup();
    render(<RecordForm {...props} contractId="00000000-0000-4000-8000-000000000004" spaces={['office_internal', 'current_contract']} />);
    await user.click(screen.getByRole('button', { name: /수리 접수/ }));
    await user.click(screen.getByRole('button', { name: /이번 계약 공유/ }));
    await user.type(screen.getByLabelText('제목'), '욕실 누수');
    await user.click(screen.getByRole('button', { name: '수리 접수하기' }));
    await waitFor(() => expect(createRecord).toHaveBeenCalled());
    const sent = createRecord.mock.calls[0][0] as FormData;
    expect(sent.get('kind')).toBe('repair');
    expect(sent.get('space')).toBe('current_contract');
    expect(sent.get('officeId')).toBe('');
    expect(sent.get('contractId')).toBe('00000000-0000-4000-8000-000000000004');
    expect(screen.getByText(/집 이력/)).toBeInTheDocument();
    expect(screen.getByText(/임대인이 승인한 집에서 열려요/)).toBeInTheDocument();
  });

  it('TEST-REC-ROLE-001 an assistant cannot save a note or repair and must add a photo', async () => {
    const user = userEvent.setup();
    render(<RecordForm {...props} canNote={false} canRepair={false} />);
    expect(screen.queryByRole('button', { name: /수리 접수/ })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('제목'), '메모');
    await user.click(screen.getByRole('button', { name: '집 기록에 남기기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('사진을 1장 이상 골라 주세요.');
    expect(createRecord).not.toHaveBeenCalled();
  });

  it('TEST-RC-REC-002 keeps the written record and explains a temporary failure', async () => {
    createRecord.mockRejectedValueOnce(new Error('private database details'));
    const user = userEvent.setup();
    render(<RecordForm {...props} />);
    await user.type(screen.getByLabelText('제목'), '입주 전 벽지 상태');
    await user.type(screen.getByLabelText('내용'), '거실 오른쪽에 오염이 있음');
    await user.click(screen.getByRole('button', { name: '집 기록에 남기기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('작성한 내용은 그대로 있어요. 잠시 후 다시 저장해 주세요.');
    expect(screen.getByLabelText('제목')).toHaveValue('입주 전 벽지 상태');
    expect(screen.getByLabelText('내용')).toHaveValue('거실 오른쪽에 오염이 있음');
    expect(screen.queryByText('private database details')).not.toBeInTheDocument();
  });
});
