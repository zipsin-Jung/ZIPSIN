import {afterEach, describe, expect, it, vi} from 'vitest';
import {createBrowserPhotoStore, photoRecordId, preparePhoto, validatePhotoFile, type StoredPhoto} from './photo-store';

function fakeIndexedDb({abortOnPut = false}: {abortOnPut?: boolean} = {}) {
  const data = new Map<string, StoredPhoto>();
  let created = false;
  const makeRequest = <T>(result: T) => {
    const request = {result, error: null, onsuccess: null as null | (() => void), onerror: null as null | (() => void)};
    queueMicrotask(() => request.onsuccess?.());
    return request;
  };
  const database = {
    objectStoreNames: {contains: () => created},
    createObjectStore: () => { created = true; },
    transaction: () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const transaction = {
        error: null,
        oncomplete: null as null | (() => void),
        onabort: null as null | (() => void),
        onerror: null as null | (() => void),
        abort: () => { if (timer) clearTimeout(timer); queueMicrotask(() => transaction.onabort?.()); },
        objectStore: () => ({
          get: (id: string) => request(data.get(id)),
          put: (photo: StoredPhoto) => request(photo.id, () => { data.set(photo.id, photo); }, abortOnPut),
          getAll: () => request([...data.values()]),
          delete: (id: string) => request(undefined, () => { data.delete(id); }),
        }),
      };
      const request = <T>(result: T, mutate?: () => void, abort = false) => {
        const value = makeRequest(result);
        const success = value.onsuccess;
        value.onsuccess = () => success?.();
        queueMicrotask(() => {
          mutate?.();
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => abort ? transaction.onabort?.() : transaction.oncomplete?.(), 0);
        });
        return value;
      };
      return transaction;
    },
    close: () => undefined,
  };
  return {open: () => {
    const request = {result: database, error: null, onupgradeneeded: null as null | (() => void), onsuccess: null as null | (() => void), onerror: null as null | (() => void)};
    queueMicrotask(() => { if (!created) request.onupgradeneeded?.(); request.onsuccess?.(); });
    return request;
  }} as unknown as IDBFactory;
}

describe('현장 사진 준비', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('후보와 항목을 섞이지 않는 고정 키로 연결한다', () => {
    expect(photoRecordId('candidate-a', 'moisture')).toBe('candidate-a::moisture');
    expect(photoRecordId('candidate-a', 'moisture')).not.toBe(photoRecordId('candidate-b', 'moisture'));
  });

  it('지원 형식과 10MB 제한을 검사한다', () => {
    expect(validatePhotoFile({type: 'image/jpeg', size: 1024})).toEqual({ok: true});
    expect(validatePhotoFile({type: 'image/heic', size: 1024})).toEqual({ok: false, message: expect.stringContaining('JPG')});
    expect(validatePhotoFile({type: 'image/png', size: 11 * 1024 * 1024})).toEqual({ok: false, message: expect.stringContaining('10MB')});
  });

  it('IndexedDB에서 후보·항목 사진을 저장하고 다시 센다', async () => {
    const store = createBrowserPhotoStore(fakeIndexedDb());
    const photo: StoredPhoto = {id: photoRecordId('a', 'moisture'), candidateId: 'a', itemId: 'moisture', blob: new Blob(['x']), mime: 'image/jpeg', bytes: 1, createdAt: '2026-10-13T00:00:00.000Z'};
    await store.put(photo);
    expect(await store.get('a', 'moisture')).toEqual(photo);
    expect(await store.get('b', 'moisture')).toBeUndefined();
    expect(await store.count('a')).toBe(1);
    expect(await store.count('b')).toBe(0);
    await store.remove('a', 'moisture');
    expect(await store.get('a', 'moisture')).toBeUndefined();
  });

  it('한 후보의 신규 사진은 원자적으로 6장까지만 허용하고 기존 사진 교체는 허용한다', async () => {
    const store = createBrowserPhotoStore(fakeIndexedDb());
    for (let index = 0; index < 6; index += 1) await store.put({id: `a::${index}`, candidateId: 'a', itemId: String(index), blob: new Blob(['x']), mime: 'image/jpeg', bytes: 1, createdAt: ''});
    await expect(store.put({id: 'a::6', candidateId: 'a', itemId: '6', blob: new Blob(['x']), mime: 'image/jpeg', bytes: 1, createdAt: ''})).rejects.toThrow('6장');
    await expect(store.put({id: 'a::0', candidateId: 'a', itemId: '0', blob: new Blob(['y']), mime: 'image/jpeg', bytes: 1, createdAt: ''})).resolves.toBeUndefined();
  });

  it('브라우저 저장소가 없거나 트랜잭션이 중단되면 성공으로 처리하지 않는다', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(createBrowserPhotoStore().get('a', 'one')).rejects.toThrow('저장할 수 없어요');
    const photo: StoredPhoto = {id: 'a::one', candidateId: 'a', itemId: 'one', blob: new Blob(['x']), mime: 'image/jpeg', bytes: 1, createdAt: ''};
    await expect(createBrowserPhotoStore(fakeIndexedDb({abortOnPut: true})).put(photo)).rejects.toThrow('완료되지 않았어요');
  });

  it('저장소 열기 오류를 호출자에게 전달한다', async () => {
    const factory = {open: () => {
      const request = {error: new Error('open failed'), onupgradeneeded: null, onsuccess: null, onerror: null as null | (() => void)};
      queueMicrotask(() => request.onerror?.());
      return request;
    }} as unknown as IDBFactory;
    await expect(createBrowserPhotoStore(factory).get('a', 'one')).rejects.toThrow('open failed');
  });

  it('사진 처리 실패 시에도 디코딩 자원을 닫는다', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({width: 8000, height: 6000, close})));
    await expect(preparePhoto(new File(['raw'], 'large.jpg', {type: 'image/jpeg'}))).rejects.toThrow('4천만 화소');
    expect(close).toHaveBeenCalledOnce();
  });

  it('캔버스 변환 실패 시에도 디코딩 자원을 닫는다', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({width: 100, height: 100, close})));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(preparePhoto(new File(['raw'], 'room.jpg', {type: 'image/jpeg'}))).rejects.toThrow('처리하지 못했어요');
    expect(close).toHaveBeenCalledOnce();
  });

  it('사진 디코딩을 지원하지 않는 브라우저를 안내한다', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    await expect(preparePhoto(new File(['raw'], 'room.jpg', {type: 'image/jpeg'}))).rejects.toThrow('안전하게 처리할 수 없어요');
  });

  it('JPEG 결과를 만들지 못해도 디코딩 자원을 닫는다', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({width: 100, height: 100, close})));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({drawImage: vi.fn()} as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null));
    await expect(preparePhoto(new File(['raw'], 'room.jpg', {type: 'image/jpeg'}))).rejects.toThrow('저장용으로 바꾸지 못했어요');
    expect(close).toHaveBeenCalledOnce();
  });
});
