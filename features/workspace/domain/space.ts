/**
 * 공간 = 위쪽 '이름 ▾'에서 고르는 것 (DEC-038: 모두 같은 홈, 공간만 바꾼다).
 * - me: 내가 임대인·임차인으로 직접 연결된 집
 * - office: 내가 구성원인 사무소의 집
 * 고른 공간은 쿠키에 남긴다. 쿠키 값이 내 사무소가 아니면 무시한다(남의 사무소를 쿠키로 열 수 없음).
 */
export const SPACE_COOKIE = 'zipsin_space';

export type SpaceOffice = { id: string; name: string; canRegisterHome: boolean };
export type Space = { kind: 'me' } | { kind: 'office'; office: SpaceOffice };

export function pickSpace(cookieValue: string | undefined, offices: SpaceOffice[], personalHomeCount: number): Space {
  if (cookieValue === 'me') return { kind: 'me' };
  const chosen = cookieValue ? offices.find((office) => office.id === cookieValue) : undefined;
  if (chosen) return { kind: 'office', office: chosen };
  // 처음: 직접 연결된 집이 없고 사무소에만 속해 있으면 사무소부터 보여 준다.
  if (personalHomeCount === 0 && offices.length) return { kind: 'office', office: offices[0] };
  return { kind: 'me' };
}

export function spaceCookieValue(space: Space): string {
  return space.kind === 'me' ? 'me' : space.office.id;
}
