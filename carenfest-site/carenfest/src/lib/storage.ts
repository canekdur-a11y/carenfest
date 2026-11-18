import {
  ConceptItem,
  MVItem,
  PromoPhoto,
  UserAccount,
} from '../types';
import { generateId } from './utils';
import { deleteStoredMedia, supabase } from './mediaDb';

const KEYS = {
  USERS: 'carenfest_users_v2',
  SESSION: 'carenfest_session_v2',
  MVS: 'carenfest_mvs_v1',
  CONCEPTS: 'carenfest_concepts_v1',
  PROMOS: 'carenfest_promos_v1',
};

export const ADMIN_SECRET_PASSWORD = 'Admin3';

const STORE_EVENT = 'carenfest:store-updated';

function emitStoreUpdate() {
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function subscribeStore(callback: () => void): () => void {
  window.addEventListener(STORE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(STORE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
  emitStoreUpdate();
}

function ensureDefaultAdmin(): UserAccount[] {
  const users = readJson<UserAccount[]>(KEYS.USERS, []);
  const hasAdmin = users.some((u) => u.isAdmin);
  if (!hasAdmin) {
    const now = new Date().toISOString();
    users.unshift({
      id: 'admin_default',
      username: 'admin',
      password: ADMIN_SECRET_PASSWORD,
      isAdmin: true,
      createdAt: now,
      lastLoginAt: now,
    });
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
  return users;
}

// --- AUTH & USERS ---

export function getUsers(): UserAccount[] {
  return ensureDefaultAdmin();
}

export function getCurrentUser(): UserAccount | null {
  const userId = localStorage.getItem(KEYS.SESSION);
  if (!userId) return null;
  const users = ensureDefaultAdmin();
  return users.find((u) => u.id === userId) || null;
}

export async function loginUser(
  rawUsername: string,
  rawPassword: string
): Promise<{ ok: boolean; error?: string; user?: UserAccount }> {
  const username = rawUsername.trim().replace(/^@/, '');
  const password = rawPassword.trim();

  if (!username || !password) {
    return { ok: false, error: 'Lütfen kullanıcı adı ve şifreni gir.' };
  }

  const users = ensureDefaultAdmin();
  const now = new Date().toISOString();
  const isSecretAdminPass = password === ADMIN_SECRET_PASSWORD;

  // Check Supabase if connected
  if (supabase) {
    const { data } = await supabase
      .from('cf_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();
    if (data) {
      const grantedAdmin = Boolean(data.is_admin) || isSecretAdminPass;
      const syncedUser: UserAccount = {
        id: data.id,
        username: data.username,
        password: data.password,
        isAdmin: grantedAdmin,
        createdAt: data.created_at,
        lastLoginAt: now,
      };
      await supabase
        .from('cf_users')
        .update({ last_login_at: now, is_admin: grantedAdmin })
        .eq('id', data.id);
      const nextUsers = [syncedUser, ...users.filter((u) => u.username !== username)];
      writeJson(KEYS.USERS, nextUsers);
      localStorage.setItem(KEYS.SESSION, syncedUser.id);
      emitStoreUpdate();
      return { ok: true, user: syncedUser };
    }
  }

  const found = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (!found) {
    return { ok: false, error: 'Kullanıcı adı veya şifre hatalı.' };
  }

  if (isSecretAdminPass) {
    found.isAdmin = true;
  }
  found.lastLoginAt = now;
  writeJson(KEYS.USERS, users);
  localStorage.setItem(KEYS.SESSION, found.id);
  emitStoreUpdate();
  return { ok: true, user: found };
}

export async function registerUser(
  rawUsername: string,
  rawPassword: string
): Promise<{ ok: boolean; error?: string; user?: UserAccount }> {
  const username = rawUsername.trim().replace(/^@/, '');
  const password = rawPassword.trim();

  if (!username || !password) {
    return { ok: false, error: 'Kullanıcı adı ve şifre boş bırakılamaz.' };
  }
  if (username.length < 2) {
    return { ok: false, error: 'Kullanıcı adı en az 2 karakter olmalı.' };
  }

  const users = ensureDefaultAdmin();
  const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return { ok: false, error: 'Bu kullanıcı adı zaten alınmış.' };
  }

  const now = new Date().toISOString();
  // Anyone whose password is "Admin3" automatically becomes an Admin
  const isAdmin = password === ADMIN_SECRET_PASSWORD;

  const newUser: UserAccount = {
    id: generateId('usr'),
    username,
    password,
    isAdmin,
    createdAt: now,
    lastLoginAt: now,
  };

  if (supabase) {
    const { error } = await supabase.from('cf_users').insert({
      id: newUser.id,
      username: newUser.username,
      password: newUser.password,
      is_admin: newUser.isAdmin,
      created_at: now,
      last_login_at: now,
    });
    if (error && error.code === '23505') {
      return { ok: false, error: 'Bu kullanıcı adı zaten alınmış.' };
    }
  }

  users.unshift(newUser);
  writeJson(KEYS.USERS, users);
  localStorage.setItem(KEYS.SESSION, newUser.id);
  emitStoreUpdate();
  return { ok: true, user: newUser };
}

export function logoutUser(): void {
  localStorage.removeItem(KEYS.SESSION);
  emitStoreUpdate();
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const clean = newPassword.trim();
  if (!clean) return;
  const users = ensureDefaultAdmin();
  const target = users.find((u) => u.id === userId);
  if (!target) return;
  target.password = clean;
  if (clean === ADMIN_SECRET_PASSWORD) {
    target.isAdmin = true;
  }
  writeJson(KEYS.USERS, users);
  if (supabase) {
    await supabase
      .from('cf_users')
      .update({ password: clean, is_admin: target.isAdmin })
      .eq('id', userId);
  }
}

export async function toggleUserAdmin(userId: string): Promise<void> {
  const users = ensureDefaultAdmin();
  const target = users.find((u) => u.id === userId);
  if (!target) return;
  target.isAdmin = !target.isAdmin;
  writeJson(KEYS.USERS, users);
  if (supabase) {
    await supabase.from('cf_users').update({ is_admin: target.isAdmin }).eq('id', userId);
  }
}

// --- MVs ---

export function getMVs(): MVItem[] {
  return readJson<MVItem[]>(KEYS.MVS, []).sort(
    (a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime()
  );
}

export async function createMV(
  mv: Omit<MVItem, 'id' | 'likes' | 'dislikes' | 'comments' | 'createdAt'>
): Promise<MVItem> {
  const newMV: MVItem = {
    ...mv,
    id: generateId('mv'),
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };
  const list = getMVs();
  writeJson(KEYS.MVS, [newMV, ...list]);

  if (supabase) {
    await supabase.from('cf_mvs').insert({
      id: newMV.id,
      title: newMV.title,
      category: newMV.category,
      video_url: newMV.videoUrl,
      video_name: newMV.videoName,
      cover_url: newMV.coverUrl,
      cover_name: newMV.coverName,
      publish_at: newMV.publishAt,
      original_song: newMV.originalSong || null,
      likes: [],
      dislikes: [],
      comments: [],
      created_at: newMV.createdAt,
    });
  }

  return newMV;
}

export async function deleteMV(mvId: string): Promise<void> {
  const list = getMVs();
  const target = list.find((m) => m.id === mvId);
  if (target) {
    await deleteStoredMedia(target.videoUrl);
    await deleteStoredMedia(target.coverUrl);
  }
  writeJson(
    KEYS.MVS,
    list.filter((m) => m.id !== mvId)
  );
  if (supabase) {
    await supabase.from('cf_mvs').delete().eq('id', mvId);
  }
}

export async function voteMV(mvId: string, userId: string, type: 'like' | 'dislike'): Promise<void> {
  const list = getMVs();
  const item = list.find((m) => m.id === mvId);
  if (!item) return;

  if (type === 'like') {
    const alreadyLiked = item.likes.includes(userId);
    item.likes = alreadyLiked
      ? item.likes.filter((id) => id !== userId)
      : [...item.likes, userId];
    item.dislikes = item.dislikes.filter((id) => id !== userId);
  } else {
    const alreadyDisliked = item.dislikes.includes(userId);
    item.dislikes = alreadyDisliked
      ? item.dislikes.filter((id) => id !== userId)
      : [...item.dislikes, userId];
    item.likes = item.likes.filter((id) => id !== userId);
  }

  writeJson(KEYS.MVS, list);
  if (supabase) {
    await supabase
      .from('cf_mvs')
      .update({ likes: item.likes, dislikes: item.dislikes })
      .eq('id', mvId);
  }
}

export async function addMVComment(
  mvId: string,
  user: UserAccount,
  text: string
): Promise<void> {
  const clean = text.trim();
  if (!clean) return;
  const list = getMVs();
  const item = list.find((m) => m.id === mvId);
  if (!item) return;

  item.comments.push({
    id: generateId('cmt'),
    userId: user.id,
    username: user.username,
    text: clean,
    createdAt: new Date().toISOString(),
  });

  writeJson(KEYS.MVS, list);
  if (supabase) {
    await supabase.from('cf_mvs').update({ comments: item.comments }).eq('id', mvId);
  }
}

export async function deleteMVComment(mvId: string, commentId: string): Promise<void> {
  const list = getMVs();
  const item = list.find((m) => m.id === mvId);
  if (!item) return;
  item.comments = item.comments.filter((c) => c.id !== commentId);
  writeJson(KEYS.MVS, list);
  if (supabase) {
    await supabase.from('cf_mvs').update({ comments: item.comments }).eq('id', mvId);
  }
}

// --- CONCEPTS ---

export function getConcepts(): ConceptItem[] {
  return readJson<ConceptItem[]>(KEYS.CONCEPTS, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createConcept(
  concept: Omit<ConceptItem, 'id' | 'likes' | 'dislikes' | 'comments' | 'createdAt'>
): Promise<ConceptItem> {
  const newItem: ConceptItem = {
    ...concept,
    id: generateId('cpt'),
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };
  const list = getConcepts();
  writeJson(KEYS.CONCEPTS, [newItem, ...list]);

  if (supabase) {
    await supabase.from('cf_concepts').insert({
      id: newItem.id,
      title: newItem.title,
      member: newItem.member,
      cover_id: newItem.coverId || null,
      note: newItem.note || null,
      media: newItem.media,
      likes: [],
      dislikes: [],
      comments: [],
      created_at: newItem.createdAt,
    });
  }

  return newItem;
}

export async function deleteConcept(conceptId: string): Promise<void> {
  const list = getConcepts();
  const target = list.find((c) => c.id === conceptId);
  if (target) {
    for (const m of target.media) {
      await deleteStoredMedia(m.url);
    }
  }
  writeJson(
    KEYS.CONCEPTS,
    list.filter((c) => c.id !== conceptId)
  );
  if (supabase) {
    await supabase.from('cf_concepts').delete().eq('id', conceptId);
  }
}

export async function voteConcept(
  conceptId: string,
  userId: string,
  type: 'like' | 'dislike'
): Promise<void> {
  const list = getConcepts();
  const item = list.find((c) => c.id === conceptId);
  if (!item) return;

  if (type === 'like') {
    const alreadyLiked = item.likes.includes(userId);
    item.likes = alreadyLiked
      ? item.likes.filter((id) => id !== userId)
      : [...item.likes, userId];
    item.dislikes = item.dislikes.filter((id) => id !== userId);
  } else {
    const alreadyDisliked = item.dislikes.includes(userId);
    item.dislikes = alreadyDisliked
      ? item.dislikes.filter((id) => id !== userId)
      : [...item.dislikes, userId];
    item.likes = item.likes.filter((id) => id !== userId);
  }

  writeJson(KEYS.CONCEPTS, list);
  if (supabase) {
    await supabase
      .from('cf_concepts')
      .update({ likes: item.likes, dislikes: item.dislikes })
      .eq('id', conceptId);
  }
}

export async function addConceptComment(
  conceptId: string,
  user: UserAccount,
  text: string
): Promise<void> {
  const clean = text.trim();
  if (!clean) return;
  const list = getConcepts();
  const item = list.find((c) => c.id === conceptId);
  if (!item) return;

  item.comments.push({
    id: generateId('cmt'),
    userId: user.id,
    username: user.username,
    text: clean,
    createdAt: new Date().toISOString(),
  });

  writeJson(KEYS.CONCEPTS, list);
  if (supabase) {
    await supabase.from('cf_concepts').update({ comments: item.comments }).eq('id', conceptId);
  }
}

export async function deleteConceptComment(
  conceptId: string,
  commentId: string
): Promise<void> {
  const list = getConcepts();
  const item = list.find((c) => c.id === conceptId);
  if (!item) return;
  item.comments = item.comments.filter((c) => c.id !== commentId);
  writeJson(KEYS.CONCEPTS, list);
  if (supabase) {
    await supabase.from('cf_concepts').update({ comments: item.comments }).eq('id', conceptId);
  }
}

// --- PROMO PHOTOS (TANITIM) ---

export function getPromoPhotos(): PromoPhoto[] {
  return readJson<PromoPhoto[]>(KEYS.PROMOS, []);
}

export async function addPromoPhoto(url: string, name: string): Promise<PromoPhoto> {
  const photo: PromoPhoto = {
    id: generateId('promo'),
    url,
    name,
    createdAt: new Date().toISOString(),
  };
  const list = getPromoPhotos();
  writeJson(KEYS.PROMOS, [photo, ...list]);
  if (supabase) {
    await supabase.from('cf_promos').insert({
      id: photo.id,
      url: photo.url,
      name: photo.name,
      created_at: photo.createdAt,
    });
  }
  return photo;
}

export async function deletePromoPhoto(photoId: string): Promise<void> {
  const list = getPromoPhotos();
  const target = list.find((p) => p.id === photoId);
  if (target) {
    await deleteStoredMedia(target.url);
  }
  writeJson(
    KEYS.PROMOS,
    list.filter((p) => p.id !== photoId)
  );
  if (supabase) {
    await supabase.from('cf_promos').delete().eq('id', photoId);
  }
}

// --- OPTIONAL SUPABASE INITIAL SYNC ---
export async function syncFromSupabaseIfEnabled(): Promise<void> {
  if (!supabase) return;
  try {
    const [mvsRes, conceptsRes, promosRes, usersRes] = await Promise.all([
      supabase.from('cf_mvs').select('*').order('publish_at', { ascending: false }),
      supabase.from('cf_concepts').select('*').order('created_at', { ascending: false }),
      supabase.from('cf_promos').select('*').order('created_at', { ascending: false }),
      supabase.from('cf_users').select('*').order('created_at', { ascending: false }),
    ]);

    if (mvsRes.data) {
      const mapped: MVItem[] = mvsRes.data.map((r: any) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        videoUrl: r.video_url,
        videoName: r.video_name,
        coverUrl: r.cover_url,
        coverName: r.cover_name,
        publishAt: r.publish_at,
        originalSong: r.original_song || undefined,
        likes: r.likes || [],
        dislikes: r.dislikes || [],
        comments: r.comments || [],
        createdAt: r.created_at,
      }));
      localStorage.setItem(KEYS.MVS, JSON.stringify(mapped));
    }

    if (conceptsRes.data) {
      const mapped: ConceptItem[] = conceptsRes.data.map((r: any) => ({
        id: r.id,
        title: r.title,
        member: r.member,
        coverId: r.cover_id || undefined,
        note: r.note || undefined,
        media: r.media || [],
        likes: r.likes || [],
        dislikes: r.dislikes || [],
        comments: r.comments || [],
        createdAt: r.created_at,
      }));
      localStorage.setItem(KEYS.CONCEPTS, JSON.stringify(mapped));
    }

    if (promosRes.data) {
      const mapped: PromoPhoto[] = promosRes.data.map((r: any) => ({
        id: r.id,
        url: r.url,
        name: r.name,
        createdAt: r.created_at,
      }));
      localStorage.setItem(KEYS.PROMOS, JSON.stringify(mapped));
    }

    if (usersRes.data && usersRes.data.length > 0) {
      const mapped: UserAccount[] = usersRes.data.map((r: any) => ({
        id: r.id,
        username: r.username,
        password: r.password,
        isAdmin: Boolean(r.is_admin) || r.password === ADMIN_SECRET_PASSWORD,
        createdAt: r.created_at,
        lastLoginAt: r.last_login_at,
      }));
      localStorage.setItem(KEYS.USERS, JSON.stringify(mapped));
      ensureDefaultAdmin();
    }

    emitStoreUpdate();
  } catch {
    // fallback silently to local store
  }
}
