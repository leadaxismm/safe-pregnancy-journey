-- v0.2 security & privacy hardening (review findings)
--  1. No direct table INSERT from the browser: events go through log_event() which validates every field.
--  2. No session identifier is stored at all (it was not needed for any statistic).
--  3. Global throttle on event logging (no per-person tracking, so no IP or fingerprint is kept).
--  4. Every row is tagged with its environment (preview / production / test) so test data never mixes with real data.
--  5. admin_stats() refuses non-admins instead of silently returning zeros.
--  6. Self-service sign-up is blocked at the database: staff accounts are created by an administrator only.
--  7. Retention: events older than 400 days are deleted automatically.
--  8. content_approvals is append-only (no update / delete for anyone).

-- ───────── events: minimise + tag environment
alter table public.events drop column if exists session_id;
alter table public.events add column if not exists env text not null default 'preview'
  check (env in ('preview', 'production', 'test'));
alter table public.events drop constraint if exists events_topic_check;
alter table public.events add constraint events_topic_check check (
  topic is null or topic in (
    'home', 'journey', 'risk', 'symptoms', 'emergency', 'where', 'tips', 'learn', 'about',
    'direct', 'obgyn-waiting', 'er-waiting', 'outpatient', 'phc', 'screens'
  )
);
drop index if exists events_event_idx;
create index if not exists events_env_event_idx on public.events (env, event, created_at);

drop policy if exists "public insert events" on public.events;
revoke insert, update, delete on public.events from anon, authenticated;

-- ───────── throttle (one counter per minute, no client identity)
create table if not exists public.event_throttle (
  bucket timestamptz primary key,
  n integer not null default 0
);
alter table public.event_throttle enable row level security; -- no policies: unreachable from the API
revoke all on public.event_throttle from anon, authenticated;

create or replace function public.log_event(p_event text, p_topic text default null, p_value integer default null, p_env text default 'preview')
returns void language plpgsql security definer set search_path = public as $$
declare
  v_n integer;
begin
  -- field validation per event type (value is the ONLY number ever stored, never an answer)
  if p_event not in ('visit','page_view','risk_check_completed','symptom_checker_opened','help_opened',
                     'learn_started','learn_completed','quiz_pre','quiz_post','quiz_danger_known','satisfaction') then
    raise exception 'invalid event' using errcode = '22023';
  end if;
  if p_env not in ('preview','production','test') then raise exception 'invalid env' using errcode = '22023'; end if;
  if (p_event in ('quiz_pre','quiz_post') and (p_value is null or p_value not between 0 and 5))
     or (p_event = 'satisfaction' and (p_value is null or p_value not between 1 and 5))
     or (p_event in ('risk_check_completed','quiz_danger_known') and (p_value is null or p_value not in (0,1)))
     or (p_event not in ('quiz_pre','quiz_post','satisfaction','risk_check_completed','quiz_danger_known') and p_value is not null) then
    raise exception 'invalid value' using errcode = '22023';
  end if;
  if (p_event = 'page_view' and p_topic is null) or (p_event not in ('page_view','visit') and p_topic is not null) then
    raise exception 'invalid topic' using errcode = '22023';
  end if;

  -- global flood protection: max 1200 events per minute across all visitors
  insert into public.event_throttle (bucket, n) values (date_trunc('minute', now()), 1)
  on conflict (bucket) do update set n = public.event_throttle.n + 1
  returning n into v_n;
  if v_n > 1200 then return; end if;

  insert into public.events (event, topic, value, env) values (p_event, p_topic, p_value::smallint, p_env);
end;
$$;
revoke all on function public.log_event(text, text, integer, text) from public;
grant execute on function public.log_event(text, text, integer, text) to anon, authenticated;

-- ───────── who am I (used by the admin UI after sign-in)
create or replace function public.admin_whoami() returns text
language sql stable security definer set search_path = public as $$
  select role from public.admins where user_id = auth.uid();
$$;
revoke all on function public.admin_whoami() from public, anon;
grant execute on function public.admin_whoami() to authenticated;

-- ───────── admin_stats: admins only, per environment
drop function if exists public.admin_stats(timestamptz, timestamptz);
create or replace function public.admin_stats(p_from timestamptz, p_to timestamptz, p_env text default 'preview')
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  with e as (
    select * from public.events where created_at >= p_from and created_at < p_to and env = p_env
  )
  select jsonb_build_object(
    'visits',            (select count(*) from e where event = 'visit'),
    'pageViews',         (select count(*) from e where event = 'page_view'),
    'riskCompleted',     (select count(*) from e where event = 'risk_check_completed'),
    'riskCompletedFull', (select count(*) from e where event = 'risk_check_completed' and value = 1),
    'symptomOpened',     (select count(*) from e where event = 'symptom_checker_opened'),
    'helpOpened',        (select count(*) from e where event = 'help_opened'),
    'learnStarted',      (select count(*) from e where event = 'learn_started'),
    'learnCompleted',    (select count(*) from e where event = 'learn_completed'),
    'preAvg',            (select round(avg(value), 2) from e where event = 'quiz_pre'),
    'preN',              (select count(*) from e where event = 'quiz_pre'),
    'postAvg',           (select round(avg(value), 2) from e where event = 'quiz_post'),
    'postN',             (select count(*) from e where event = 'quiz_post'),
    'dangerKnownPct',    (select round(100.0 * avg(value), 1) from e where event = 'quiz_danger_known'),
    'dangerN',           (select count(*) from e where event = 'quiz_danger_known'),
    'satisfactionAvg',   (select round(avg(value), 2) from e where event = 'satisfaction'),
    'satisfactionN',     (select count(*) from e where event = 'satisfaction'),
    'satisfactionDist',  (select jsonb_agg((select count(*) from e where event = 'satisfaction' and value = v) order by v) from generate_series(1, 5) v),
    'topTopics',         (select coalesce(jsonb_agg(jsonb_build_object('topic', topic, 'views', n) order by n desc), '[]'::jsonb)
                            from (select topic, count(*) n from e where event = 'page_view' group by topic order by n desc limit 12) t),
    'sources',           (select coalesce(jsonb_agg(jsonb_build_object('topic', topic, 'views', n) order by n desc), '[]'::jsonb)
                            from (select coalesce(topic, 'direct') topic, count(*) n from e where event = 'visit' group by 1) t),
    'monthly',           (select coalesce(jsonb_agg(m order by m->>'month'), '[]'::jsonb) from (
                            select jsonb_build_object(
                              'month',           to_char(date_trunc('month', created_at), 'YYYY-MM'),
                              'visits',          count(*) filter (where event = 'visit'),
                              'riskCompleted',   count(*) filter (where event = 'risk_check_completed'),
                              'learnStarted',    count(*) filter (where event = 'learn_started'),
                              'learnCompleted',  count(*) filter (where event = 'learn_completed'),
                              'preAvg',          round(avg(value) filter (where event = 'quiz_pre'), 2),
                              'postAvg',         round(avg(value) filter (where event = 'quiz_post'), 2),
                              'dangerKnownPct',  round(100.0 * avg(value) filter (where event = 'quiz_danger_known'), 1),
                              'satisfactionAvg', round(avg(value) filter (where event = 'satisfaction'), 2)
                            ) m from e group by date_trunc('month', created_at)) mm)
  ) into r;
  return r;
end;
$$;
revoke all on function public.admin_stats(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.admin_stats(timestamptz, timestamptz, text) to authenticated;

-- ───────── tighten table grants
revoke all on public.admins from anon;
revoke all on public.ed_monthly from anon;
revoke all on public.content_approvals from anon;
revoke update, delete on public.content_approvals from authenticated; -- append-only log
create policy "admins read all admins" on public.admins for select to authenticated using (public.is_admin());

-- ───────── block self-service sign-up (only an administrator creates staff accounts via SQL)
create or replace function public.block_self_signup() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  -- session_user (not current_user) identifies the Auth service connection
  if session_user = 'supabase_auth_admin' then
    raise exception 'Sign-ups are disabled for this project';
  end if;
  return new;
end;
$$;
drop trigger if exists block_self_signup on auth.users;
create trigger block_self_signup before insert on auth.users for each row execute function public.block_self_signup();

-- ───────── retention
create or replace function public.purge_old_events() returns void
language sql security definer set search_path = public as $$
  delete from public.events where created_at < now() - interval '400 days';
  delete from public.event_throttle where bucket < now() - interval '1 day';
$$;
revoke all on function public.purge_old_events() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('spj-purge-old-events', '17 3 * * *', 'select public.purge_old_events()');

-- defence in depth: anon has no table privileges at all (RLS would return 0 rows anyway)
revoke all on public.events from anon;
-- helper role checks are only needed by signed-in users (RLS policies)
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_admin_editor() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin_editor() to authenticated;
comment on function public.log_event(text,text,integer,text) is 'Intentionally public: validated, throttled anonymous event logging. Stores no identifiers.';
comment on function public.admin_stats(timestamptz,timestamptz,text) is 'Callable by authenticated users but raises 42501 unless caller is in public.admins.';
