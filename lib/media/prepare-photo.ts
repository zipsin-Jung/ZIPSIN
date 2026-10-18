/**
 * 사진을 올리기 전에 휴대폰에서 정리한다 (2026-10-18 승인 제안 ⑤-나, 디자인 '사진').
 * - JPG·HEIC 사진은 다시 그려 JPG로 저장한다. 이때 사진 속 위치정보(GPS) 등 촬영 정보가 빠진다.
 * - 긴 변이 MAX_EDGE보다 크면 줄인다. 너무 큰 PNG도 JPG로 줄인다.
 * - 브라우저가 사진을 열 수 없으면(예: HEIC를 못 여는 PC 브라우저) 원본을 그대로 올리고, 위치정보를 지우지 못했다고 알려 준다.
 */
export const MAX_EDGE = 2560;
export const JPEG_QUALITY = 0.85;
const PNG_KEEP_BYTES = 2 * 1024 * 1024;

export type PreparedPhoto = { file: File; converted: boolean; locationRemoved: boolean };
export type Encoder = (file: File, maxEdge: number, quality: number) => Promise<Blob | null>;

export function needsReencode(file: { type: string; size: number }): boolean {
  if (['image/jpeg', 'image/heic', 'image/heif', 'image/webp'].includes(file.type)) return true;
  if (file.type === 'image/png') return file.size > PNG_KEEP_BYTES;
  return false;
}

export function jpegName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, '');
  return `${base || 'photo'}.jpg`;
}

/* v8 ignore start -- 브라우저 캔버스 경계는 Preview 휴대폰 확인으로 검증한다. */
export const canvasEncoder: Encoder = async (file, maxEdge, quality) => {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null;
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { return null; }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) { bitmap.close(); return null; }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise<Blob | null>((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality));
};
/* v8 ignore stop */

export async function preparePhoto(file: File, encode: Encoder = canvasEncoder): Promise<PreparedPhoto> {
  if (!needsReencode(file)) return { file, converted: false, locationRemoved: file.type === 'image/png' };
  const blob = await encode(file, MAX_EDGE, JPEG_QUALITY).catch(() => null);
  if (!blob || blob.size === 0) return { file, converted: false, locationRemoved: false };
  return { file: new File([blob], jpegName(file.name), { type: 'image/jpeg', lastModified: file.lastModified }), converted: true, locationRemoved: true };
}
