import { describe, expect, it } from 'vitest';
import { localTimeFromMillis, parseExif, readPhotoMeta } from '@/lib/media/photo-meta';

/** 시험용 JPEG: APP1(Exif) 안에 촬영 시각과 GPS를 넣는다. little=true면 II(인텔) 순서. */
function exifJpeg({ taken, gps, little = false }: { taken?: string; gps?: { lat: [number, number, number]; latRef: 'N' | 'S'; lng: [number, number, number]; lngRef: 'E' | 'W' }; little?: boolean }) {
  const tiff: number[] = [];
  const u16 = (at: number, v: number) => { if (little) { tiff[at] = v & 255; tiff[at + 1] = v >> 8; } else { tiff[at] = v >> 8; tiff[at + 1] = v & 255; } };
  const u32 = (at: number, v: number) => { const b = [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]; (little ? b.reverse() : b).forEach((x, i) => { tiff[at + i] = x; }); };
  const ascii = (at: number, s: string) => { for (let i = 0; i < s.length; i += 1) tiff[at + i] = s.charCodeAt(i); tiff[at + s.length] = 0; };
  for (let i = 0; i < 400; i += 1) tiff.push(0);
  tiff[0] = little ? 0x49 : 0x4d; tiff[1] = tiff[0]; u16(2, 42); u32(4, 8);
  const entries: Array<[number, number, number, number]> = [];
  if (taken) entries.push([0x8769, 4, 1, 100]);
  if (gps) entries.push([0x8825, 4, 1, 200]);
  u16(8, entries.length);
  entries.forEach(([tag, type, count, value], i) => { const at = 10 + i * 12; u16(at, tag); u16(at + 2, type); u32(at + 4, count); u32(at + 8, value); });
  u32(10 + entries.length * 12, 0);
  if (taken) { u16(100, 1); u16(102, 0x9003); u16(104, 2); u32(106, 20); u32(110, 140); u32(114, 0); ascii(140, taken); }
  if (gps) {
    u16(200, 4);
    const put = (i: number, tag: number, type: number, count: number, value: number, inline?: string) => { const at = 202 + i * 12; u16(at, tag); u16(at + 2, type); u32(at + 4, count); if (inline) { tiff[at + 8] = inline.charCodeAt(0); tiff[at + 9] = 0; } else u32(at + 8, value); };
    put(0, 1, 2, 2, 0, gps.latRef); put(1, 2, 5, 3, 300); put(2, 3, 2, 2, 0, gps.lngRef); put(3, 4, 5, 3, 330);
    u32(250, 0);
    gps.lat.forEach((v, i) => { u32(300 + i * 8, Math.round(v * 100)); u32(304 + i * 8, 100); });
    gps.lng.forEach((v, i) => { u32(330 + i * 8, Math.round(v * 100)); u32(334 + i * 8, 100); });
  }
  const payload = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const length = payload.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, length >> 8, length & 255, ...payload, 0xff, 0xd9]).buffer;
}

describe('사진 촬영 정보 읽기 (휴대폰 안에서만, 서버로 보내지 않음)', () => {
  it('TEST-BULK-META-001 reads the capture time and GPS from a big-endian JPEG', () => {
    const meta = parseExif(exifJpeg({ taken: '2026:10:15 14:30:00', gps: { lat: [37, 37, 30], latRef: 'N', lng: [127, 4, 48], lngRef: 'E' } }));
    expect(meta.takenAt).toEqual({ year: 2026, month: 10, day: 15, hour: 14, minute: 30 });
    expect(meta.gps?.lat).toBeCloseTo(37.625, 4);
    expect(meta.gps?.lng).toBeCloseTo(127.08, 4);
  });

  it('TEST-BULK-META-002 reads little-endian files and southern/western coordinates', () => {
    const meta = parseExif(exifJpeg({ little: true, taken: '2025:03:02 09:05:00', gps: { lat: [33, 30, 0], latRef: 'S', lng: [70, 15, 0], lngRef: 'W' } }));
    expect(meta.takenAt).toEqual({ year: 2025, month: 3, day: 2, hour: 9, minute: 5 });
    expect(meta.gps?.lat).toBeCloseTo(-33.5, 4);
    expect(meta.gps?.lng).toBeCloseTo(-70.25, 4);
  });

  it('TEST-BULK-META-003 returns empty info for files without EXIF, broken files and non-JPEG data', () => {
    expect(parseExif(exifJpeg({}))).toEqual({ takenAt: null, gps: null });
    expect(parseExif(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00]).buffer)).toEqual({ takenAt: null, gps: null });
    expect(parseExif(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toEqual({ takenAt: null, gps: null });
    expect(parseExif(exifJpeg({ taken: '0000:00:00 00:00:00' })).takenAt).toBeNull();
  });

  it('TEST-BULK-META-006 skips other segments before EXIF and stops at image data', () => {
    const exif = new Uint8Array(exifJpeg({ taken: '2026:10:15 08:00:00' }));
    const app0 = [0xff, 0xe0, 0x00, 0x04, 0x00, 0x00];
    const withApp0 = new Uint8Array([0xff, 0xd8, ...app0, ...exif.slice(2)]).buffer;
    expect(parseExif(withApp0).takenAt).toEqual({ year: 2026, month: 10, day: 15, hour: 8, minute: 0 });
    const sosFirst = new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x04, 0x00, 0x00, ...exif.slice(2)]).buffer;
    expect(parseExif(sosFirst)).toEqual({ takenAt: null, gps: null });
    expect(parseExif(new Uint8Array([0xff, 0xd8, 0x12, 0x34, 0x00, 0x04]).buffer)).toEqual({ takenAt: null, gps: null });
  });

  it('TEST-BULK-META-004 falls back to the file time in Korea time when the photo has no capture time', async () => {
    const file = new File([new Uint8Array([0x89, 0x50])], 'a.png', { type: 'image/png', lastModified: Date.UTC(2026, 9, 15, 6, 0) });
    expect(await readPhotoMeta(file)).toEqual({ takenAt: { year: 2026, month: 10, day: 15, hour: 15, minute: 0 }, gps: null });
    expect(localTimeFromMillis(Date.UTC(2026, 9, 14, 16, 30))).toEqual({ year: 2026, month: 10, day: 15, hour: 1, minute: 30 });
  });

  it('TEST-BULK-META-005 prefers the capture time inside a JPEG over the file time', async () => {
    const file = new File([exifJpeg({ taken: '2026:09:30 20:10:00' })], 'b.jpg', { type: 'image/jpeg', lastModified: Date.UTC(2026, 9, 18, 0, 0) });
    expect((await readPhotoMeta(file)).takenAt).toEqual({ year: 2026, month: 9, day: 30, hour: 20, minute: 10 });
  });
});
