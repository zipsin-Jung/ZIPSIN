/** 기록하기 시트에서 고른 종류가 어느 집 화면으로 가는지. 모르는 값은 사진 기록으로. */
export function recordTargetHref(homeId: string, kind: string | undefined): string {
  if (kind === 'inspection') return `/homes/${homeId}/move-in`;
  if (kind === 'repair' || kind === 'note') return `/homes/${homeId}/records/new?kind=${kind}`;
  return `/homes/${homeId}/records/new`;
}
