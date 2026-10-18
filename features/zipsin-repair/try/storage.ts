import { initialState, type TryState } from '@/features/zipsin-repair/try/model';

/** 체험판은 이 휴대폰(브라우저)에만 저장한다. 서버로 보내지 않는다. */
export const REPAIR_TRY_STORAGE_KEY = 'zipsin-repair-try-v1';

export function loadTryState(storage: Pick<Storage, 'getItem'> | undefined): TryState {
  try {
    const raw = storage?.getItem(REPAIR_TRY_STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<TryState>;
    if (parsed?.v !== 1 || !Array.isArray(parsed.jobs) || !Array.isArray(parsed.teams)) return initialState();
    return parsed as TryState;
  } catch {
    return initialState();
  }
}

/** 사진이 많아 저장 공간이 넘치면 false를 돌려준다(화면에서 안내) */
export function saveTryState(state: TryState, storage: Pick<Storage, 'setItem'> | undefined): boolean {
  try {
    storage?.setItem(REPAIR_TRY_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** 사진을 작게 줄여 저장한다(긴 변 960px, JPEG). 브라우저에서만 쓴다 */
export async function shrinkPhoto(file: File, maxSide = 960): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('photo_unreadable'));
      img.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}
