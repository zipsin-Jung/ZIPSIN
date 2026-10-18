import { describe, expect, it } from 'vitest';
import { validateAttachmentSelection } from '@/features/attachments/domain/validation';

describe('attachment selection', () => {
  it('TEST-FILE-001 accepts up to ten supported files under 20MB', () => {
    const files = [{ name: '입주-사진.jpg', type: 'image/jpeg', size: 1024 }, { name: '계약서.pdf', type: 'application/pdf', size: 2048 }];
    expect(validateAttachmentSelection(files)).toEqual({ ok: true });
  });
  it('TEST-FILE-002 rejects unsupported types, oversized files and more than ten', () => {
    expect(validateAttachmentSelection([{ name: 'run.exe', type: 'application/x-msdownload', size: 100 }]).ok).toBe(false);
    expect(validateAttachmentSelection([{ name: 'big.pdf', type: 'application/pdf', size: 20 * 1024 * 1024 + 1 }]).ok).toBe(false);
    expect(validateAttachmentSelection(Array.from({ length: 11 }, (_, index) => ({ name: `${index}.png`, type: 'image/png', size: 100 }))).ok).toBe(false);
  });
  it('TEST-FILE-003 rejects empty and control-character file names', () => {
    expect(validateAttachmentSelection([{ name: '', type: 'image/png', size: 100 }]).ok).toBe(false);
    expect(validateAttachmentSelection([{ name: 'bad\u0000.png', type: 'image/png', size: 100 }]).ok).toBe(false);
  });
});

describe('video attachments (30초 동영상)', () => {
  it('TEST-VIDEO-001 accepts MP4/MOV up to 50MB and 30 seconds', () => {
    expect(validateAttachmentSelection([{ name: '누수.mov', type: 'video/quicktime', size: 40 * 1024 * 1024, durationSeconds: 29.8 }])).toEqual({ ok: true });
    expect(validateAttachmentSelection([{ name: 'a.mp4', type: 'video/mp4', size: 1000, durationSeconds: 30.4 }]).ok).toBe(true);
  });
  it('TEST-VIDEO-002 rejects long, unmeasured, or oversized videos', () => {
    expect(validateAttachmentSelection([{ name: 'a.mp4', type: 'video/mp4', size: 1000, durationSeconds: 31 }])).toMatchObject({ ok: false, error: '동영상은 30초까지 올릴 수 있어요.' });
    expect(validateAttachmentSelection([{ name: 'a.mp4', type: 'video/mp4', size: 1000, durationSeconds: null }]).ok).toBe(false);
    expect(validateAttachmentSelection([{ name: 'a.mp4', type: 'video/mp4', size: 50 * 1024 * 1024 + 1, durationSeconds: 10 }])).toMatchObject({ ok: false, error: '동영상은 개당 50MB 이하여야 합니다.' });
  });
});
