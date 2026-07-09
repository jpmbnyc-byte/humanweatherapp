const DB_NAME = 'human-weather';
const STORE = 'settings';

export function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet(key: string): Promise<string | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const get = tx.objectStore(STORE).get(key);
    get.onsuccess = () => resolve((get.result as string | undefined) ?? null);
    get.onerror = () => reject(get.error);
  });
}

export async function idbSet(key: string, value: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGetJson<T>(key: string): Promise<T | null> {
  const raw = await idbGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function idbSetJson(key: string, value: unknown): Promise<void> {
  await idbSet(key, JSON.stringify(value));
}
