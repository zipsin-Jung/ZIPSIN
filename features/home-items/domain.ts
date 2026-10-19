export const HOME_ITEM_CATEGORIES = [
  { id: 'boiler', label: '보일러' },
  { id: 'aircon', label: '에어컨' },
  { id: 'water_heater', label: '온수기' },
  { id: 'wallpaper', label: '벽지·도배' },
  { id: 'flooring', label: '바닥' },
  { id: 'faucet', label: '수전' },
  { id: 'door_lock', label: '도어락' },
  { id: 'appliance', label: '가전' },
  { id: 'other', label: '기타' },
] as const;
export type HomeItemCategory = (typeof HOME_ITEM_CATEGORIES)[number]['id'];
export const categoryLabel = (id: string) => HOME_ITEM_CATEGORIES.find((category) => category.id === id)?.label ?? '기타';

/** 'YYYY-MM-DD' → '2025.03' (집 이력은 달까지만 보여 준다). */
export function monthLabel(date: string | null): string | null {
  if (!date || !/^\d{4}-\d{2}/.test(date)) return null;
  return `${date.slice(0, 4)}.${date.slice(5, 7)}`;
}

/** 마지막으로 손본 날 = 교체일, 없으면 설치일. 최근 것이 위로. */
export function sortHomeItems<T extends { installedOn: string | null; replacedOn: string | null; name: string }>(items: T[]): T[] {
  const last = (item: T) => item.replacedOn ?? item.installedOn ?? '';
  return [...items].sort((a, b) => last(b).localeCompare(last(a)) || a.name.localeCompare(b.name, 'ko'));
}
