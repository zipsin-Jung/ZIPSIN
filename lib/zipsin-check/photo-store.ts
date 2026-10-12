export type StoredPhoto = {
  id: string;
  candidateId: string;
  itemId: string;
  blob: Blob;
  mime: string;
  bytes: number;
  createdAt: string;
};

export type PhotoStore = {
  get(candidateId: string, itemId: string): Promise<StoredPhoto | undefined>;
  put(photo: StoredPhoto): Promise<void>;
  count(candidateId: string): Promise<number>;
  remove(candidateId: string, itemId: string): Promise<void>;
};

const DB_NAME = 'zipsin-check-photos:v1';
const STORE_NAME = 'photos';
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_PHOTOS_PER_CANDIDATE = 6;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function photoRecordId(candidateId: string, itemId: string) {
  return `${candidateId}::${itemId}`;
}

export function validatePhotoFile(file: Pick<File, 'type' | 'size'>): {ok: true} | {ok: false; message: string} {
  if (!ALLOWED_TYPES.has(file.type)) return {ok: false, message: 'JPG, PNG, WebP 사진만 저장할 수 있어요.'};
  if (file.size > MAX_INPUT_BYTES) return {ok: false, message: '사진은 10MB 이하로 선택해 주세요.'};
  return {ok: true};
}

export async function preparePhoto(file: File): Promise<Blob> {
  const valid = validatePhotoFile(file);
  if (!valid.ok) throw new Error(valid.message);
  if (typeof createImageBitmap !== 'function') throw new Error('이 브라우저에서는 사진을 안전하게 처리할 수 없어요.');
  const image = await createImageBitmap(file);
  try {
    if (image.width * image.height > MAX_IMAGE_PIXELS) throw new Error('사진 해상도가 너무 커요. 4천만 화소 이하 사진을 선택해 주세요.');
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('사진을 처리하지 못했어요. 다른 사진을 선택해 주세요.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    if (!blob) throw new Error('사진을 저장용으로 바꾸지 못했어요.');
    return blob;
  } finally {
    image.close();
  }
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, {keyPath: 'id'});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('사진 저장소를 열지 못했어요.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('사진 저장에 실패했어요.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('사진 저장이 완료되지 않았어요.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('사진 저장에 실패했어요.'));
  });
}

export function createBrowserPhotoStore(factory?: IDBFactory): PhotoStore {
  const getFactory = () => factory ?? globalThis.indexedDB;
  const withStore = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, transaction: IDBTransaction) => Promise<T>) => {
    const available = getFactory();
    if (!available) throw new Error('이 브라우저에서는 사진을 저장할 수 없어요.');
    const database = await openDatabase(available);
    try {
      const transaction = database.transaction(STORE_NAME, mode);
      const result = action(transaction.objectStore(STORE_NAME), transaction);
      const [value] = await Promise.all([result, transactionDone(transaction)]);
      return value;
    } finally {
      database.close();
    }
  };
  return {
    async get(candidateId, itemId) {
      return withStore('readonly', (store) => requestResult(store.get(photoRecordId(candidateId, itemId)))) as Promise<StoredPhoto | undefined>;
    },
    async put(photo) {
      await withStore('readwrite', async (store, transaction) => {
        const all = await requestResult(store.getAll()) as StoredPhoto[];
        const replacesExisting = all.some((saved) => saved.id === photo.id);
        const candidateCount = all.filter((saved) => saved.candidateId === photo.candidateId).length;
        if (!replacesExisting && candidateCount >= MAX_PHOTOS_PER_CANDIDATE) {
          transaction.abort();
          throw new Error('한 집에는 사진을 6장까지 저장할 수 있어요.');
        }
        await requestResult(store.put(photo));
      });
    },
    async count(candidateId) {
      const all = await withStore('readonly', (store) => requestResult(store.getAll())) as StoredPhoto[];
      return all.filter((photo) => photo.candidateId === candidateId).length;
    },
    async remove(candidateId, itemId) {
      await withStore('readwrite', async (store) => { await requestResult(store.delete(photoRecordId(candidateId, itemId))); });
    },
  };
}
