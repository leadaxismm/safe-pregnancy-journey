-- رحلة الحمل الآمن — Safe Pregnancy Journey
-- Aggregate-only analytics + admin data. NO personal or individual health data is stored.
--   * events: anonymous usage events. Patients' questionnaire / symptom ANSWERS are never sent.
--   * ed_monthly: aggregated, officially-approved ED figures entered by admins for impact evaluation.
--   * content_approvals: clinical sign-off log for content versions.

-- ───────────────────────── admins
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
create or replace function public.is_admin_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and role = 'editor');
$$;

create policy "admins read self" on public.admins for select to authenticated using (user_id = auth.uid());

-- ───────────────────────── events (anonymous)
create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text not null check (char_length(session_id) <= 40),
  event text not null check (event in (
    'visit', 'page_view', 'risk_check_completed', 'symptom_checker_opened', 'help_opened',
    'learn_started', 'learn_completed', 'quiz_pre', 'quiz_post', 'quiz_danger_known', 'satisfaction'
  )),
  topic text check (topic is null or (char_length(topic) <= 40 and topic ~ '^[a-z0-9/_-]+$')),
  value smallint check (value is null or value between 0 and 5)
);
create index if not exists events_created_idx on public.events (created_at);
create index if not exists events_event_idx on public.events (event, created_at);
alter table public.events enable row level security;

-- Anyone (the public patient site) may INSERT one validated event; nobody but admins may read.
create policy "public insert events" on public.events for insert to anon, authenticated with check (true);
create policy "admins read events" on public.events for select to authenticated using (public.is_admin());
revoke update, delete on public.events from anon, authenticated;

-- ───────────────────────── ED aggregated figures (entered manually from approved hospital reports)
create table if not exists public.ed_monthly (
  month date primary key check (extract(day from month) = 1),
  total_visits integer not null check (total_visits >= 0),
  nonurgent_visits integer not null check (nonurgent_visits >= 0 and nonurgent_visits <= total_visits),
  source text not null default '',
  entered_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);
alter table public.ed_monthly enable row level security;
create policy "admins read ed" on public.ed_monthly for select to authenticated using (public.is_admin());
create policy "editors write ed" on public.ed_monthly for all to authenticated using (public.is_admin_editor()) with check (public.is_admin_editor());

-- ───────────────────────── content approvals (clinical governance log)
create table if not exists public.content_approvals (
  id bigint generated always as identity primary key,
  content_version text not null,
  decision text not null check (decision in ('approved', 'changes_requested')),
  reviewer text not null,            -- name / role of the clinical reviewer
  notes text not null default '',
  reviewed_at date not null default current_date,
  entered_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.content_approvals enable row level security;
create policy "admins read approvals" on public.content_approvals for select to authenticated using (public.is_admin());
create policy "editors add approvals" on public.content_approvals for insert to authenticated with check (public.is_admin_editor());

-- ───────────────────────── aggregated statistics for the dashboard
create or replace function public.admin_stats(p_from timestamptz, p_to timestamptz)
returns jsonb language sql stable security invoker set search_path = public as $$
  with e as (
    select * from public.events where created_at >= p_from and created_at < p_to
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
                            from (select topic, count(*) n from e where event = 'page_view' and topic is not null group by topic order by n desc limit 12) t),
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
  );
$$;
revoke execute on function public.admin_stats(timestamptz, timestamptz) from anon;

-- After creating an admin user in Supabase Auth, grant access:
--   insert into public.admins (user_id, role) values ('<auth-user-uuid>', 'editor');
