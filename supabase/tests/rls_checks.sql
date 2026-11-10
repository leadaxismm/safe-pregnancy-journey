-- Permission checks run against project safe-pregnancy-journey-preview on 2026-11-10 (all passed).
-- Run as the postgres role in the SQL editor. Any failure raises an exception listing the broken rule.
-- Part A: anonymous visitor and signed-in NON-staff account (21 checks)
do $$
declare ok int := 0; fail text := ''; n int;
begin
  set local role anon;
  perform public.log_event('visit','direct',null,'test'); ok := ok + 1;
  perform public.log_event('quiz_post',null,4,'test'); ok := ok + 1;
  begin perform public.log_event('quiz_pre',null,9,'test'); fail := fail||' anon_bad_value_accepted'; exception when others then ok := ok+1; end;
  begin perform public.log_event('page_view','<script>',null,'test'); fail := fail||' anon_bad_topic_accepted'; exception when others then ok := ok+1; end;
  begin perform public.log_event('hack',null,null,'test'); fail := fail||' anon_bad_event'; exception when others then ok := ok+1; end;
  begin perform public.log_event('help_opened',null,1,'test'); fail := fail||' anon_value_on_help'; exception when others then ok := ok+1; end;
  begin perform public.log_event('visit','direct',null,'prod'); fail := fail||' anon_bad_env'; exception when others then ok := ok+1; end;
  begin insert into public.events(event,env) values ('visit','test'); fail := fail||' anon_direct_insert'; exception when others then ok := ok+1; end;
  begin select count(*) into n from public.events; fail := fail||' anon_read_events'; exception when others then ok := ok+1; end;
  begin perform public.admin_stats(now()-interval '1 day', now(), 'test'); fail := fail||' anon_stats'; exception when others then ok := ok+1; end;
  begin insert into public.content_approvals(content_version,decision,reviewer) values ('x','approved','x'); fail := fail||' anon_approve'; exception when others then ok := ok+1; end;
  begin insert into public.ed_monthly(month,total_visits,nonurgent_visits) values ('2026-01-01',1,0); fail := fail||' anon_ed'; exception when others then ok := ok+1; end;
  begin select count(*) into n from public.admins; fail := fail||' anon_read_admins'; exception when others then ok := ok+1; end;
  begin perform public.purge_old_events(); fail := fail||' anon_purge'; exception when others then ok := ok+1; end;
  begin perform public.admin_whoami(); fail := fail||' anon_whoami'; exception when others then ok := ok+1; end;
  reset role;
  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.admin_stats(now()-interval '1 day', now(), 'test'); fail := fail||' nonadmin_stats'; exception when others then ok := ok+1; end;
  select count(*) into n from public.events; if n = 0 then ok := ok+1; else fail := fail||' nonadmin_reads_events'; end if;
  begin insert into public.content_approvals(content_version,decision,reviewer) values ('x','approved','x'); fail := fail||' nonadmin_approve'; exception when others then ok := ok+1; end;
  begin insert into public.ed_monthly(month,total_visits,nonurgent_visits) values ('2026-01-01',1,0); fail := fail||' nonadmin_ed'; exception when others then ok := ok+1; end;
  begin insert into public.admins(user_id,role) values ('11111111-1111-1111-1111-111111111111','editor'); fail := fail||' nonadmin_self_promote'; exception when others then ok := ok+1; end;
  if public.admin_whoami() is null then ok := ok+1; else fail := fail||' nonadmin_whoami'; end if;
  reset role;
  if fail <> '' then raise exception 'RLS test failures:%', fail; end if;
  raise notice 'passed=%', ok;
end $$;
-- Part B (13 checks: editor can read/approve/enter ED data; approvals append-only; viewer read-only) is the same
-- pattern with request.jwt.claims.sub set to a real staff user id; see docs/FIX_REPORT_v0.2.md.
