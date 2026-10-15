alter table public.candidate_photos add column local_photo_id text;
create unique index candidate_photos_local_unique on public.candidate_photos(candidate_id, local_photo_id) where local_photo_id is not null;

create table public.photo_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','complete','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, storage_path)
);
alter table public.photo_cleanup_queue enable row level security;
create policy "cleanup_owner_read" on public.photo_cleanup_queue for select using (owner_user_id=auth.uid());
create policy "cleanup_owner_insert" on public.photo_cleanup_queue for insert with check (owner_user_id=auth.uid());
