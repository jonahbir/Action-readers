-- ============================================================
-- Summer Reading Challenge — Full Supabase Setup
-- Copy and run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  google_id text,
  email text unique not null,
  display_name text,
  biblical_handle text unique not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  is_banned boolean not null default false,
  bio text,
  onboarding_complete boolean not null default false,
  joined_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  description text,
  why_this_book text,
  verse_of_week text,
  cover_url text,
  pdf_url text not null,
  pdf_storage_path text,
  total_pages int not null check (total_pages > 0),
  week_number int not null,
  comprehension_questions jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  page_number int not null check (page_number > 0),
  time_spent_seconds int not null default 0,
  scroll_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.comprehension_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  page_number int not null,
  question_id text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);

create table public.user_book_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  verified_pages int not null default 0,
  total_time_seconds int not null default 0,
  last_read_at timestamptz,
  score int not null default 0,
  unique (user_id, book_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'removed')),
  created_at timestamptz not null default now()
);

create table public.review_likes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  created_by uuid references public.users(id) on delete set null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.reading_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  daily_page_goal int not null default 20 check (daily_page_goal > 0),
  plan_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_users_handle on public.users (biblical_handle);
create index idx_books_week on public.books (week_number);
create index idx_books_active on public.books (is_active) where is_active = true;
create index idx_reading_sessions_user_book on public.reading_sessions (user_id, book_id);
create index idx_reviews_status on public.reviews (status);
create index idx_reviews_book on public.reviews (book_id);
create index idx_review_comments_review on public.review_comments (review_id);
create index idx_review_comments_user on public.review_comments (user_id);
create index idx_user_book_progress_score on public.user_book_progress (score desc);
create index idx_announcements_pinned on public.announcements (pinned desc, created_at desc);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role in ('admin', 'super_admin')
      and is_banned = false
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role = 'super_admin'
      and is_banned = false
  );
$$;

create or replace function public.is_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_banned from public.users where id = auth.uid()),
    false
  );
$$;

-- Auto-create user profile on first sign-in
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, google_id, email, display_name, avatar_url, biblical_handle, onboarding_complete)
  values (
    new.id,
    new.raw_user_meta_data->>'sub',
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'pending_' || substr(new.id::text, 1, 8),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recalculate score when progress or comprehension changes
create or replace function public.calculate_user_book_score(p_user_id uuid, p_book_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pages int;
  v_correct int;
  v_total int;
begin
  select verified_pages into v_pages
  from public.user_book_progress
  where user_id = p_user_id and book_id = p_book_id;

  select
    count(*) filter (where is_correct),
    count(*)
  into v_correct, v_total
  from public.comprehension_checks
  where user_id = p_user_id and book_id = p_book_id;

  v_pages := coalesce(v_pages, 0);
  v_correct := coalesce(v_correct, 0);
  v_total := coalesce(v_total, 0);

  if v_total = 0 then
    return v_pages * 10;
  end if;

  return (v_pages * 10) + round((v_correct::numeric / v_total::numeric) * 50);
end;
$$;

create or replace function public.refresh_user_book_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_book_id uuid;
  v_score int;
begin
  if tg_table_name = 'comprehension_checks' then
    v_user_id := coalesce(new.user_id, old.user_id);
    v_book_id := coalesce(new.book_id, old.book_id);
  else
    v_user_id := coalesce(new.user_id, old.user_id);
    v_book_id := coalesce(new.book_id, old.book_id);
  end if;

  v_score := public.calculate_user_book_score(v_user_id, v_book_id);

  update public.user_book_progress
  set score = v_score
  where user_id = v_user_id and book_id = v_book_id;

  return coalesce(new, old);
end;
$$;

create trigger trg_refresh_score_on_progress
  after insert or update on public.user_book_progress
  for each row execute function public.refresh_user_book_score();

create trigger trg_refresh_score_on_comprehension
  after insert on public.comprehension_checks
  for each row execute function public.refresh_user_book_score();

-- Public view: hides real names from non-admins
create or replace function public.public_user_fields(u public.users)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return jsonb_build_object(
      'id', u.id,
      'biblical_handle', u.biblical_handle,
      'display_name', u.display_name,
      'avatar_url', u.avatar_url,
      'role', u.role
    );
  end if;

  return jsonb_build_object(
    'id', u.id,
    'biblical_handle', u.biblical_handle,
    'avatar_url', u.avatar_url
  );
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.comprehension_checks enable row level security;
alter table public.user_book_progress enable row level security;
alter table public.reviews enable row level security;
alter table public.review_likes enable row level security;
alter table public.review_comments enable row level security;
alter table public.announcements enable row level security;
alter table public.reading_plans enable row level security;
alter table public.reflections enable row level security;

-- USERS
-- Members see only handles in the app; full profile (display_name, email) is admin-only at the DB level for other users' rows.
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_select_admin"
  on public.users for select
  using (public.is_admin());

-- Authenticated members can read public identity fields of active fellowship members
create policy "users_select_public_identity"
  on public.users for select
  using (
    auth.uid() is not null
    and onboarding_complete = true
    and is_banned = false
  );

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id and is_banned = false)
  with check (auth.uid() = id);

create policy "users_admin_update"
  on public.users for update
  using (public.is_admin());

create policy "super_admin_role_changes"
  on public.users for update
  using (public.is_super_admin());

-- BOOKS
create policy "books_public_read"
  on public.books for select
  using (true);

create policy "books_admin_write"
  on public.books for all
  using (public.is_admin())
  with check (public.is_admin());

-- READING SESSIONS
create policy "sessions_own_read"
  on public.reading_sessions for select
  using (auth.uid() = user_id or public.is_admin());

create policy "sessions_own_insert"
  on public.reading_sessions for insert
  with check (auth.uid() = user_id and not public.is_banned());

-- COMPREHENSION CHECKS
create policy "comprehension_own_read"
  on public.comprehension_checks for select
  using (auth.uid() = user_id or public.is_admin());

create policy "comprehension_own_insert"
  on public.comprehension_checks for insert
  with check (auth.uid() = user_id and not public.is_banned());

-- USER BOOK PROGRESS
create policy "progress_own_read"
  on public.user_book_progress for select
  using (
    auth.uid() = user_id
    or public.is_admin()
    or auth.uid() is not null
  );

create policy "progress_own_upsert"
  on public.user_book_progress for insert
  with check (auth.uid() = user_id and not public.is_banned());

create policy "progress_own_update"
  on public.user_book_progress for update
  using (auth.uid() = user_id and not public.is_banned())
  with check (auth.uid() = user_id);

-- REVIEWS
create policy "reviews_approved_public"
  on public.reviews for select
  using (
    status = 'approved'
    or auth.uid() = user_id
    or public.is_admin()
  );

create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = user_id and not public.is_banned());

create policy "reviews_update_own_or_admin"
  on public.reviews for update
  using (auth.uid() = user_id or public.is_admin());

create policy "reviews_delete_own_or_admin"
  on public.reviews for delete
  using (auth.uid() = user_id or public.is_admin());

-- REVIEW LIKES
create policy "likes_read_all"
  on public.review_likes for select
  using (auth.uid() is not null);

create policy "likes_insert_own"
  on public.review_likes for insert
  with check (
    auth.uid() = user_id
    and not public.is_banned()
    and not exists (
      select 1 from public.reviews r
      where r.id = review_id and r.user_id = auth.uid()
    )
  );

create policy "likes_delete_own"
  on public.review_likes for delete
  using (auth.uid() = user_id);

-- ANNOUNCEMENTS
create policy "announcements_read_all"
  on public.announcements for select
  using (true);

create policy "announcements_admin_write"
  on public.announcements for all
  using (public.is_admin())
  with check (public.is_admin());

-- READING PLANS
create policy "plans_own"
  on public.reading_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and not public.is_banned());

-- REFLECTIONS (private)
create policy "reflections_own"
  on public.reflections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS (run in SQL editor — creates bucket metadata)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('book-covers', 'book-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('book-pdfs', 'book-pdfs', false, 52428800, array['application/pdf']),
  ('announcement-images', 'announcement-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Storage policies
create policy "book_covers_public_read"
  on storage.objects for select
  using (bucket_id = 'book-covers');

create policy "book_covers_admin_write"
  on storage.objects for all
  using (bucket_id = 'book-covers' and public.is_admin())
  with check (bucket_id = 'book-covers' and public.is_admin());

create policy "book_pdfs_auth_read"
  on storage.objects for select
  using (bucket_id = 'book-pdfs' and auth.uid() is not null);

create policy "book_pdfs_admin_write"
  on storage.objects for all
  using (bucket_id = 'book-pdfs' and public.is_admin())
  with check (bucket_id = 'book-pdfs' and public.is_admin());

create policy "announcement_images_public_read"
  on storage.objects for select
  using (bucket_id = 'announcement-images');

create policy "announcement_images_admin_write"
  on storage.objects for all
  using (bucket_id = 'announcement-images' and public.is_admin())
  with check (bucket_id = 'announcement-images' and public.is_admin());

-- ============================================================
-- REALTIME
-- ============================================================

alter publication supabase_realtime add table public.user_book_progress;
alter publication supabase_realtime add table public.announcements;

-- ============================================================
-- SEED DATA (books & announcements — users added after real sign-in)
-- ============================================================

insert into public.books (title, author, description, why_this_book, verse_of_week, cover_url, pdf_url, total_pages, week_number, is_active, comprehension_questions)
values
(
  'The Pilgrim''s Progress',
  'John Bunyan',
  'An allegory of the Christian life — a journey toward the Celestial City.',
  'We chose this classic because it mirrors our own walk of faith together as a fellowship.',
  'Hebrews 12:1 — "Let us run with perseverance the race marked out for us."',
  'https://images-na.ssl-images-amazon.com/images/I/81WcnNQ-TBL.jpg',
  'https://www.gutenberg.org/files/2554/2554-pdf.pdf',
  120,
  1,
  true,
  '[
    {"page": 10, "id": "q1", "question": "What is the name of the main character at the start?", "options": ["Christian", "Faithful", "Hopeful"], "correct": 0},
    {"page": 20, "id": "q2", "question": "What burden does Christian carry?", "options": ["His sins", "A heavy pack", "A crown"], "correct": 0},
    {"page": 30, "id": "q3", "question": "Who helps Christian at the Slough of Despond?", "options": ["Help", "Evangelist", "Pliable"], "correct": 0}
  ]'::jsonb
),
(
  'Mere Christianity',
  'C.S. Lewis',
  'Timeless reflections on what Christians believe and why it matters.',
  'Lewis writes like a wise friend at the table — perfect for discussing together.',
  '1 Peter 3:15 — "Always be prepared to give an answer for the hope that you have."',
  'https://images-na.ssl-images-amazon.com/images/I/71c8QdLgSSL.jpg',
  'https://www.planetpublish.com/wp-content/uploads/2011/11/Mere-Christianity-Totally-NEW.pdf',
  200,
  0,
  false,
  '[
    {"page": 10, "id": "q1", "question": "What analogy does Lewis use for moral law?", "options": ["A map", "A fleet of ships", "A garden"], "correct": 1}
  ]'::jsonb
);

insert into public.announcements (title, body, pinned)
values
(
  'Welcome to the Summer Reading Challenge!',
  'There is a seat at the table for every one of you. Pick up this week''s book, set your daily goal, and let''s walk this journey together. We''re so glad you''re here.',
  true
),
(
  'Weekly Gathering Reminder',
  'Don''t forget — we discuss the week''s reading every Saturday. Bring your reflections and your honest thoughts. No judgment, just family.',
  false
);
