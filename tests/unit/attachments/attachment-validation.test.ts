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
