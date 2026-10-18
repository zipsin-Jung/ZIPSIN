import { describe, expect, it, vi } from 'vitest';
import { uploadRecordFiles, type UploadDeps } from '@/features/records/client/upload-record-files';

const recordId = '00000000-0000-4000-8000-000000000009';
const file = (name: string, type = 'image/jpeg') => new File([new Uint8Array(4)], name, { type });

function deps(overrides: Partial<UploadDeps> = {}): UploadDeps {
  return {
    prepare: vi.fn(async (input: File) => ({ file: input, converted: false, locationRemoved: true })),
    prepareUpload: vi.fn(async () => ({ ok: true as const, attachmentId: '00000000-0000-4000-8000-00000000000a', storagePath: 'path' })),
    putObject: vi.fn(async () => ({ error: null })),
    complete: vi.fn(async () => ({ ok: true as const })),
    ...overrides,
  };
}

describe('기록에 사진 올리기 (한 장씩, 실패한 것만 다시)', () => {
  it('TEST-BULK-UP-001 removes location before upload and reports each saved photo', async () => {
    const d = deps();
    const progress = vi.fn();
    const result = await uploadRecordFiles(recordId, [file('a.jpg'), file('b.jpg')], d, progress);
    expect(result.items.map((item) => item.status)).toEqual(['saved', 'saved']);
    expect(result.locationKept).toBe(0);
    expect(d.prepare).toHaveBeenCalledTimes(2);
    expect(d.prepareUpload).toHaveBeenCalledWith({ recordId, name: 'a.jpg', type: 'image/jpeg', size: 4 });
    expect(progress).toHaveBeenLastCalledWith(2);
  });

  it('TEST-BULK-UP-002 keeps going after a failure at any step and returns the original file for retry', async () => {
    const d = deps({
      prepareUpload: vi.fn()
        .mockResolvedValueOnce({ ok: false, error: '권한이 없어요.' })
        .mockResolvedValue({ ok: true, attachmentId: '00000000-0000-4000-8000-00000000000a', storagePath: 'p' }),
      putObject: vi.fn().mockResolvedValueOnce({ error: { message: 'network' } }).mockResolvedValue({ error: null }),
      complete: vi.fn().mockResolvedValueOnce({ ok: false, error: '확인하지 못했어요.' }),
    });
    const files = [file('a.jpg'), file('b.jpg'), file('c.jpg')];
    const result = await uploadRecordFiles(recordId, files, d);
    expect(result.items.map((item) => [item.status, item.message])).toEqual([
      ['failed', '권한이 없어요.'],
      ['failed', '올리지 못했어요.'],
      ['failed', '확인하지 못했어요.'],
    ]);
    expect(result.items.map((item) => item.file)).toEqual(files);
  });

  it('TEST-BULK-UP-003 counts photos whose location could not be removed and treats a crashed step as a failure', async () => {
    const d = deps({
      prepare: vi.fn(async (input: File) => ({ file: input, converted: false, locationRemoved: input.name !== 'heic.heic' })),
      putObject: vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ error: null }),
    });
    const result = await uploadRecordFiles(recordId, [file('x.jpg'), file('heic.heic', 'image/heic')], d);
    expect(result.items.map((item) => item.status)).toEqual(['failed', 'saved']);
    expect(result.locationKept).toBe(1);
  });
});
