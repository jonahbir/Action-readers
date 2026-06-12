-- Migration v3: phone numbers on user profiles
alter table public.users add column if not exists phone text;
