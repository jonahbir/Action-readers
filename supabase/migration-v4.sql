-- Migration v4: fix recursive score trigger (stack depth limit exceeded on progress save)
-- Run this in Supabase SQL Editor on an existing project.

create or replace function public.refresh_user_book_score_on_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_book_id uuid;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  v_book_id := coalesce(new.book_id, old.book_id);
  new.score := public.calculate_user_book_score(v_user_id, v_book_id);
  return new;
end;
$$;

create or replace function public.refresh_user_book_score_from_comprehension()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score int;
begin
  v_score := public.calculate_user_book_score(new.user_id, new.book_id);

  update public.user_book_progress
  set score = v_score
  where user_id = new.user_id
    and book_id = new.book_id
    and score is distinct from v_score;

  return new;
end;
$$;

drop trigger if exists trg_refresh_score_on_progress on public.user_book_progress;
drop trigger if exists trg_refresh_score_on_comprehension on public.comprehension_checks;

create trigger trg_refresh_score_on_progress
  before insert or update on public.user_book_progress
  for each row execute function public.refresh_user_book_score_on_progress();

create trigger trg_refresh_score_on_comprehension
  after insert on public.comprehension_checks
  for each row execute function public.refresh_user_book_score_from_comprehension();

drop function if exists public.refresh_user_book_score();
