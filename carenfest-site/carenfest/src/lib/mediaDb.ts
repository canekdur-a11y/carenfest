import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { generateId } from './utils';

const DB_NAME = 'carenfest_media_store';
const STORE_NAME = 'files';
const DB_VERSION = 1;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMediaFile(file: File): Promise<string> {
  const id = generateId('media');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

  // If Supabase is configured, upload to public Storage bucket so all devices can see it
  if (supabase) {
    const path = `${id}_${safeName}`;
    const { error } = await supabase.storage
      .from('carenfest-media')
      .upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('carenfest-media').getPublicUrl(path);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  }

  // Always save in IndexedDB for instant offline/local large-file support without QuotaExceededError
  const db = await openMediaDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return `idb://${id}`;
}

export async function getMediaBlob(url: string): Promise<Blob | null> {
  if (!url) return null;
  if (url.startsWith('idb://')) {
    const id = url.replace('idb://', '');
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve((req.result as Blob) || null);
      req.onerror = () => reject(req.error);
    });
  }
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.blob();
}

export async function deleteStoredMedia(url: string): Promise<void> {
  if (!url) return;
  if (url.startsWith('idb://')) {
    const id = url.replace('idb://', '');
    try {
      const db = await openMediaDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }
}

export async function downloadMediaDirectly(url: string, filename: string): Promise<boolean> {
  try {
    const blob = await getMediaBlob(url);
    if (!blob) return false;
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || 'carenfest-dosya';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    return true;
  } catch {
    return false;
  }
}

const objectUrlCache = new Map<string, string>();

export function useResolvedMediaUrl(rawUrl?: string): string {
  const [resolved, setResolved] = useState<string>(() => {
    if (!rawUrl) return '';
    if (!rawUrl.startsWith('idb://')) return rawUrl;
    return objectUrlCache.get(rawUrl) || '';
  });

  useEffect(() => {
    let active = true;
    if (!rawUrl) {
      setResolved('');
      return;
    }
    if (!rawUrl.startsWith('idb://')) {
      setResolved(rawUrl);
      return;
    }
    const cached = objectUrlCache.get(rawUrl);
    if (cached) {
      setResolved(cached);
      return;
    }
    getMediaBlob(rawUrl)
      .then((blob) => {
        if (!active || !blob) return;
        const objUrl = URL.createObjectURL(blob);
        objectUrlCache.set(rawUrl, objUrl);
        setResolved(objUrl);
      })
      .catch(() => {
        if (active) setResolved('');
      });

    return () => {
      active = false;
    };
  }, [rawUrl]);

  return resolved;
}
