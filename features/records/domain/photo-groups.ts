import type { GeoPoint, LocalTime } from '@/lib/media/photo-meta';

/**
 * 사진 묶기 규칙 (승인 시안 ⑤-나): 같은 날 같은 오전/오후끼리, 그 안에서 300m 넘게 떨어진 곳은 따로.
 * 위치가 없는 사진은 그 시간대의 첫 장소에 붙는다. 시간을 모르는 사진은 맨 끝 '날짜 모름'.
 */
export const PLACE_SPLIT_METERS = 300;
export type PhotoForGrouping = { id: string; takenAt: LocalTime | null; gps: GeoPoint | null };
export type PhotoGroup = { key: string; label: string; ids: string[] };

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const rad = (degree: number) => (degree * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat); const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export function groupLabel(time: LocalTime, currentYear: number): string {
  const year = time.year === currentYear ? '' : `${time.year}년 `;
  return `${year}${time.month}월 ${time.day}일 ${time.hour < 12 ? '오전' : '오후'}`;
}

const sortKey = (time: LocalTime) => `${time.year}`.padStart(4, '0') + `${time.month}`.padStart(2, '0') + `${time.day}`.padStart(2, '0') + (time.hour < 12 ? '0' : '1');

export function groupPhotos(photos: PhotoForGrouping[], currentYear: number): PhotoGroup[] {
  const slots = new Map<string, { label: string; places: Array<{ anchor: GeoPoint | null; ids: string[] }> }>();
  const unknown: string[] = [];
  for (const photo of photos) {
    if (!photo.takenAt) { unknown.push(photo.id); continue; }
    const key = sortKey(photo.takenAt);
    const slot = slots.get(key) ?? { label: groupLabel(photo.takenAt, currentYear), places: [] };
    slots.set(key, slot);
    let place = photo.gps ? slot.places.find((item) => !item.anchor || distanceMeters(item.anchor, photo.gps as GeoPoint) <= PLACE_SPLIT_METERS) : slot.places[0];
    if (!place) { place = { anchor: photo.gps, ids: [] }; slot.places.push(place); }
    if (!place.anchor && photo.gps) place.anchor = photo.gps;
    place.ids.push(photo.id);
  }
  const groups: PhotoGroup[] = [];
  for (const key of [...slots.keys()].sort().reverse()) {
    const slot = slots.get(key) as { label: string; places: Array<{ ids: string[] }> };
    slot.places.forEach((place, index) => groups.push({ key: `${key}-${index}`, label: index === 0 ? slot.label : `${slot.label} · 다른 장소`, ids: place.ids }));
  }
  if (unknown.length) groups.push({ key: 'unknown', label: '날짜 모름', ids: unknown });
  return groups;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const parts: T[][] = [];
  for (let i = 0; i < items.length; i += size) parts.push(items.slice(i, i + size));
  return parts;
}
