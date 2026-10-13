import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  complete: vi.fn(),
  upload: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/features/attachments/actions/upload', () => ({
  prepareAttachmentUploadAction: mocks.prepare,
  completeAttachmentUploadAction: mocks.complete,
}));
vi.mock('@/lib/supabase/client', () => ({
  createBrowserSupabaseClient: () => ({ storage: { from: () => ({ upload: mocks.upload }) } }),
}));

import { AttachmentUploader } from '@/features/attachments/components/AttachmentUploader';

describe('AttachmentUploader', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TEST-RC-FILE-001 keeps successful files and retries only the failed file', async () => {
    mocks.prepare
      .mockResolvedValueOnce({ ok: true, attachmentId: 'saved-id', storagePath: 'saved.jpg' })
      .mockResolvedValueOnce({ ok: true, attachmentId: 'failed-id', storagePath: 'failed.jpg' })
      .mockResolvedValueOnce({ ok: true, attachmentId: 'retry-id', storagePath: 'failed-retry.jpg' });
    mocks.upload
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'network' } })
      .mockResolvedValueOnce({ error: null });
    mocks.complete.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AttachmentUploader recordId="00000000-0000-4000-8000-000000000001" />);

    const saved = new File(['saved'], 'saved.jpg', { type: 'image/jpeg' });
    const failed = new File(['failed'], 'failed.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('사진·PDF 추가'), [saved, failed]);

    expect(await screen.findByText('saved.jpg')).toHaveAccessibleDescription('저장 완료');
    expect(screen.getByText('failed.jpg')).toHaveAccessibleDescription('저장 실패');
    await user.click(screen.getByRole('button', { name: '실패한 파일 1개 다시 시도' }));

    await waitFor(() => expect(mocks.prepare).toHaveBeenCalledTimes(3));
    expect(mocks.prepare.mock.calls[2][0]).toMatchObject({ name: 'failed.jpg' });
    expect(mocks.prepare.mock.calls.filter(([input]) => input.name === 'saved.jpg')).toHaveLength(1);
    expect(await screen.findByText('failed.jpg')).toHaveAccessibleDescription('저장 완료');
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
