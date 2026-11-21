const DB_NAME = 'form-photos';
const STORE_NAME = 'photos';
const DB_VERSION = 1;

const memoryFallback = new Map<string, string>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Photo storage error'));
    tx.onabort = () => reject(tx.error ?? new Error('Photo storage aborted'));
  });
}

export async function putPhoto(id: string, dataUrl: string): Promise<void> {
  const db = await openDb();
  if (!db) {
    memoryFallback.set(id, dataUrl);
    return;
  }
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(dataUrl, id);
  await transactionDone(tx);
}

export async function getPhoto(id: string): Promise<string | null> {
  const db = await openDb();
  if (!db) return memoryFallback.get(id) ?? null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
    request.onerror = () => resolve(null);
  });
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDb();
  if (!db) {
    memoryFallback.delete(id);
    return;
  }
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  await transactionDone(tx);
}

export async function clearPhotos(): Promise<void> {
  memoryFallback.clear();
  const db = await openDb();
  if (!db) return;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  await transactionDone(tx);
}

const urlCache = new Map<string, string>();

export async function photoUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const data = await getPhoto(id);
  if (data) urlCache.set(id, data);
  return data;
}

export function cachePhotoUrl(id: string, dataUrl: string): void {
  urlCache.set(id, dataUrl);
}

export function invalidatePhotoUrl(id: string): void {
  urlCache.delete(id);
}
