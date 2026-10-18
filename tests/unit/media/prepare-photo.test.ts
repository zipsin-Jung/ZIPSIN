import { describe, expect, it, vi } from 'vitest';
import { jpegName, needsReencode, preparePhoto } from '@/lib/media/prepare-photo';

const file = (name: string, type: string, size = 1000) => new File([new Uint8Array(size)], name, { type });

describe('preparePhoto', () => {
  it('TEST-MEDIA-001 re-encodes JPG and HEIC to JPG so location data is removed', async () => {
    const encode = vi.fn().mockResolvedValue(new Blob([new Uint8Array(10)], { type: 'image/jpeg' }));
    const heic = await preparePhoto(file('IMG_0001.HEIC', 'image/heic'), encode);
    expect(heic.file.type).toBe('image/jpeg');
    expect(heic.file.name).toBe('IMG_0001.jpg');
    expect(heic.locationRemoved).toBe(true);
    const jpg = await preparePhoto(file('a.jpeg', 'image/jpeg'), encode);
    expect(jpg.converted).toBe(true);
    expect(encode).toHaveBeenCalledWith(expect.any(File), 2560, 0.85);
  });

  it('TEST-MEDIA-002 keeps the original and reports that location was not removed when the browser cannot open it', async () => {
    const original = file('IMG.HEIC', 'image/heic');
    const result = await preparePhoto(original, vi.fn().mockResolvedValue(null));
    expect(result).toEqual({ file: original, converted: false, locationRemoved: false });
    const thrown = await preparePhoto(original, vi.fn().mockRejectedValue(new Error('decode')));
    expect(thrown.file).toBe(original);
  });

  it('TEST-MEDIA-003 leaves PDFs and small PNGs alone', async () => {
    const encode = vi.fn();
    expect((await preparePhoto(file('doc.pdf', 'application/pdf'), encode)).file.type).toBe('application/pdf');
    expect((await preparePhoto(file('s.png', 'image/png'), encode)).converted).toBe(false);
    expect(encode).not.toHaveBeenCalled();
    expect(needsReencode({ type: 'image/png', size: 3 * 1024 * 1024 })).toBe(true);
    expect(jpegName('.hidden')).toBe('photo.jpg');
    expect(jpegName('사진')).toBe('사진.jpg');
  });
});
