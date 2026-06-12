-- ============================================================
-- Seed Data — Yonas Birhanu (test user)
-- ============================================================
--
-- IMPORTANT: Run this ONLY AFTER you have:
--   1. Run supabase/schema.sql in Supabase SQL Editor
--   2. Signed in once on the site with birhanuyonas056@gmail.com via Google
--
-- Then paste and run this entire file in Supabase SQL Editor.
-- ============================================================

-- 1. Set profile, handle, bio, and make super admin for testing
UPDATE public.users
SET
  display_name = 'Yonas Birhanu',
  biblical_handle = 'jonah',
  bio = 'I am loved!',
  onboarding_complete = true,
  role = 'super_admin'
WHERE email = 'birhanuyonas056@gmail.com';

-- Stop here if the UPDATE above says "0 rows" — you have not signed in with Google yet.
-- Sign in on the site first, then run this file again.

-- 2. Daily reading plan
INSERT INTO public.reading_plans (user_id, daily_page_goal, plan_data, updated_at)
SELECT
  u.id,
  20,
  jsonb_build_object(
    to_char(current_date, 'YYYY-MM-DD'), 5,
    to_char(current_date - 1, 'YYYY-MM-DD'), 22,
    to_char(current_date - 2, 'YYYY-MM-DD'), 18
  ),
  now()
FROM public.users u
WHERE u.email = 'birhanuyonas056@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  daily_page_goal = 20,
  plan_data = EXCLUDED.plan_data,
  updated_at = now();

-- 3. Reading progress on the active book (so Home shows a progress bar)
INSERT INTO public.user_book_progress (user_id, book_id, verified_pages, total_time_seconds, score, last_read_at)
SELECT
  u.id,
  b.id,
  24,
  3600,
  public.calculate_user_book_score(u.id, b.id),
  now()
FROM public.users u
CROSS JOIN public.books b
WHERE u.email = 'birhanuyonas056@gmail.com'
  AND b.is_active = true
ON CONFLICT (user_id, book_id) DO UPDATE SET
  verified_pages = 24,
  total_time_seconds = 3600,
  score = public.calculate_user_book_score(EXCLUDED.user_id, EXCLUDED.book_id),
  last_read_at = now();

-- 4. A few reading sessions (shows "reading today" on Home)
INSERT INTO public.reading_sessions (user_id, book_id, page_number, time_spent_seconds, scroll_completed, created_at)
SELECT u.id, b.id, gs.page, 90, true, now() - (gs.page || ' minutes')::interval
FROM public.users u
CROSS JOIN public.books b
CROSS JOIN generate_series(1, 5) AS gs(page)
WHERE u.email = 'birhanuyonas056@gmail.com'
  AND b.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.reading_sessions rs
    WHERE rs.user_id = u.id AND rs.book_id = b.id
  );

-- 5. Sample approved review (shows on Home + Reviews wall)
INSERT INTO public.reviews (user_id, book_id, rating, content, status)
SELECT
  u.id,
  b.id,
  5,
  'What a beautiful start to our fellowship reading journey. Bunyan writes with such warmth — I felt like I was walking the path alongside Christian.',
  'approved'
FROM public.users u
CROSS JOIN public.books b
WHERE u.email = 'birhanuyonas056@gmail.com'
  AND b.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.user_id = u.id AND r.book_id = b.id
  );

-- Verify
SELECT biblical_handle, display_name, email, role, onboarding_complete, bio
FROM public.users
WHERE email = 'birhanuyonas056@gmail.com';
