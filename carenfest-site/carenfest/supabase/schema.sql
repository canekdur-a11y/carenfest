-- CARENFEST Supabase Veritabanı ve Storage Kurulum Şeması
-- Çoklu cihaz senkronizasyonu isterseniz bu kodu Supabase SQL Editor'de çalıştırın.

create table if not exists public.cf_users (
  id text primary key,
  username text unique not null,
  password text not null,
  is_admin boolean default false,
  created_at timestamptz default now(),
  last_login_at timestamptz default now()
);

create table if not exists public.cf_mvs (
  id text primary key,
  title text not null,
  category text not null check (category in ('Klip Cover', 'Şarkı Cover', 'Dans Cover')),
  video_url text not null,
  video_name text not null,
  cover_url text not null,
  cover_name text not null,
  publish_at timestamptz not null,
  original_song text,
  likes jsonb default '[]'::jsonb,
  dislikes jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.cf_concepts (
  id text primary key,
  title text not null,
  member text not null,
  cover_id text,
  note text,
  media jsonb default '[]'::jsonb,
  likes jsonb default '[]'::jsonb,
  dislikes jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.cf_promos (
  id text primary key,
  url text not null,
  name text not null,
  created_at timestamptz default now()
);

-- Varsayılan Admin Hesabı (Şifresi Admin3 olan herkes otomatik Admin olur)
insert into public.cf_users (id, username, password, is_admin)
values ('admin_default', 'admin', 'Admin3', true)
on conflict (username) do update set is_admin = true, password = 'Admin3';

-- Public Storage Bucket
insert into storage.buckets (id, name, public)
values ('carenfest-media', 'carenfest-media', true)
on conflict (id) do nothing;

create policy "Public Access" on storage.objects for all using (bucket_id = 'carenfest-media') with check (bucket_id = 'carenfest-media');
