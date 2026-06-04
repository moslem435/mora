import { getUserId, supabase } from './supabase';
import { storage } from './core-storage';

const DB_NAME = 'MoraNavDB';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveLocalAsset(key: string, value: Blob | File): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export const dbStorage = {
  async saveLocalAssetOnly(key: string, value: Blob | File): Promise<void> {
    await saveLocalAsset(key, value);
  },

  async saveAsset(key: string, value: Blob | File): Promise<string | null> {
    await saveLocalAsset(key, value);

    if (!supabase) return null;

    try {
      const userId = await getUserId();
      if (!userId) return null;

      const hasPermission = await storage.getCurrentUserUploadPermission();
      if (!hasPermission) {
        throw new Error('您暂无上传物理文件权限，请联系管理员开通');
      }

      let ext = 'bin';
      if (value instanceof File) {
        ext = value.name.split('.').pop() || 'bin';
      } else if (value.type) {
        ext = value.type.split('/').pop() || 'bin';
      }

      const fileName = `${userId}/${key}.${ext}`;

      const { error } = await supabase.storage
        .from('mora-assets')
        .upload(fileName, value, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('mora-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (e) {
      console.error('Failed to upload asset to Supabase Storage:', e);
      return null;
    }
  },

  async getAsset(key: string): Promise<Blob | File | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteAsset(key: string): Promise<void> {
    const db = await getDB();

    if (supabase) {
      getUserId().then(userId => {
        if (userId) {
          // 由于后缀名不确定，暂时忽略，用户在桶里直接覆盖上传即可
        }
      }).catch(err => console.error(err));
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear(): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
