export type MVCategory = 'Klip Cover' | 'Şarkı Cover' | 'Dans Cover';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface CommentItem {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface MVItem {
  id: string;
  title: string;
  category: MVCategory;
  videoUrl: string; // Can be https:// URL or idb://<key>
  videoName: string;
  coverUrl: string; // Can be https:// URL or idb://<key>
  coverName: string;
  publishAt: string; // ISO datetime string
  originalSong?: string;
  likes: string[]; // array of userIds
  dislikes: string[]; // array of userIds
  comments: CommentItem[];
  createdAt: string;
}

export interface ConceptMediaItem {
  id: string;
  url: string; // Can be https:// URL or idb://<key>
  name: string;
  type: 'image' | 'video';
}

export interface ConceptItem {
  id: string;
  title: string;
  member: string;
  coverId?: string;
  note?: string;
  media: ConceptMediaItem[];
  likes: string[];
  dislikes: string[];
  comments: CommentItem[];
  createdAt: string;
}

export interface PromoPhoto {
  id: string;
  url: string;
  name: string;
  createdAt: string;
}
