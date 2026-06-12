-- Migration v2: PDF storage paths + review comments
-- Run this in Supabase SQL Editor on an existing project.

-- PDF storage path (preferred over long-lived signed URLs)
alter table public.books add column if not exists pdf_storage_path text;

-- Review comments
create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_review_comments_review on public.review_comments (review_id);
create index if not exists idx_review_comments_user on public.review_comments (user_id);

alter table public.review_comments enable row level security;

drop policy if exists "comments_read_approved" on public.review_comments;
create policy "comments_read_approved"
  on public.review_comments for select
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (r.status = 'approved' or auth.uid() = r.user_id or public.is_admin())
    )
  );

drop policy if exists "comments_insert_own" on public.review_comments;
create policy "comments_insert_own"
  on public.review_comments for insert
  with check (
    auth.uid() = user_id
    and not public.is_banned()
    and exists (
      select 1 from public.reviews r
      where r.id = review_id and r.status = 'approved'
    )
  );

drop policy if exists "comments_delete_own_or_admin" on public.review_comments;
create policy "comments_delete_own_or_admin"
  on public.review_comments for delete
  using (auth.uid() = user_id or public.is_admin());

do $$ begin
  alter publication supabase_realtime add table public.review_comments;
exception when duplicate_object then null;
end $$;
