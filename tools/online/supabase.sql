-- PandAventures: the gang's online Hall of Fame (Supabase).
--
-- Paste this whole file in Supabase → SQL Editor → New query → Run.
-- Safe to run again (it only creates what is missing and resets the rules).
--
-- One table of scores (panda_scores), written by the game with the public key. The database
-- itself refuses impossible scores (same limits as the game) and too many sends
-- in a row; players cannot edit or delete anything. The game reads the "panda_board"
-- view: each player's best per game, with their latest name. Player ids (one
-- random id per phone) are never readable from outside.

-- The highest marathon score a run reaching `lvl` games can have (every game won,
-- streak multipliers ×1 to ×4: see web/src/marathon/hof.js maxScore).
create or replace function public.panda_max_score(lvl integer) returns integer
language sql immutable as $$
  select least(lvl, 4) * 10
       + greatest(least(lvl, 9) - 4, 0) * 20
       + greatest(least(lvl, 19) - 9, 0) * 30
       + greatest(lvl - 19, 0) * 40
$$;

create table if not exists public.panda_scores (
  id bigint generated always as identity primary key,
  player_id uuid not null,
  name text not null,
  game text not null,
  score integer not null,
  level integer,
  streak integer,
  hero text,
  ride_time integer,
  home boolean,
  played_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- What a score must look like (the game checks the same before sending)
alter table public.panda_scores drop constraint if exists name_ok;
alter table public.panda_scores add constraint name_ok check (char_length(btrim(name)) between 1 and 20);
alter table public.panda_scores drop constraint if exists game_ok;
alter table public.panda_scores add constraint game_ok check (game in ('marathon', 'flipper', 'spx'));
alter table public.panda_scores drop constraint if exists hero_ok;
alter table public.panda_scores add constraint hero_ok check (hero is null or hero in ('panda', 'cous', 'mamar', 'babar', 'victor', 'romain', 'eugenie', 'violaine', 'aline', 'greg'));
alter table public.panda_scores drop constraint if exists score_ok;
alter table public.panda_scores add constraint score_ok check (
  score > 0 and score <= case game when 'marathon' then 100000 when 'flipper' then 50000000 else 200000 end
);
alter table public.panda_scores drop constraint if exists marathon_ok;
alter table public.panda_scores add constraint marathon_ok check (
  game <> 'marathon' or (
    level between 1 and 2000 and streak between 0 and level
    and score % 10 = 0 and score >= streak * 10 and score <= public.panda_max_score(level)
  )
);
alter table public.panda_scores drop constraint if exists spx_ok;
alter table public.panda_scores add constraint spx_ok check (game <> 'spx' or home is not true or ride_time >= 80);
alter table public.panda_scores drop constraint if exists date_ok;
alter table public.panda_scores add constraint date_ok check (
  played_at >= timestamptz '2026-11-01' and played_at <= created_at + interval '10 minutes'
);

create index if not exists panda_scores_by_player on public.panda_scores (player_id, game, created_at desc);

-- No more than one send per player and game every 10 seconds
create or replace function public.panda_scores_slow_down() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.panda_scores
    where player_id = new.player_id and game = new.game and created_at > now() - interval '10 seconds'
  ) then
    raise exception 'too soon';
  end if;
  return new;
end $$;
drop trigger if exists panda_scores_slow_down on public.panda_scores;
create trigger panda_scores_slow_down before insert on public.panda_scores
  for each row execute function public.panda_scores_slow_down();

-- Who can do what: anyone can add a score (only these columns), nobody can read
-- the raw table (player ids stay private), edit or delete.
alter table public.panda_scores enable row level security;
drop policy if exists "add scores" on public.panda_scores;
create policy "add scores" on public.panda_scores for insert to anon, authenticated with check (true);
revoke all on public.panda_scores from anon, authenticated;
grant insert (player_id, name, game, score, level, streak, hero, ride_time, home, played_at)
  on public.panda_scores to anon, authenticated;

-- The board: each player's best per game, with the name they use now
create or replace view public.panda_board as
with best as (
  select distinct on (game, player_id)
    game, player_id, score, level, streak, hero, ride_time, home, played_at
  from public.panda_scores
  order by game, player_id, score desc, played_at asc
), names as (
  select distinct on (player_id) player_id, name
  from public.panda_scores
  order by player_id, created_at desc
)
select b.game, n.name, b.score, b.level, b.streak, b.hero, b.ride_time, b.home, b.played_at
from best b join names n using (player_id);

revoke all on public.panda_board from anon, authenticated;
grant select on public.panda_board to anon, authenticated;
