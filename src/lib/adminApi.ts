/**
 * Admin data layer (v0.2).
 *  - Real admin (#/admin): Supabase Auth email + password ONLY. After sign-in the account must exist in
 *    public.admins (checked server-side by admin_whoami); otherwise it is signed out. Every read/write is
 *    also enforced by RLS and by checks inside the SQL functions, so the UI is not the security boundary.
 *  - Demo (#/admin-demo): a separate, read-only, unauthenticated view of SAMPLE numbers. It never talks to
 *    the database and cannot sign in, approve content or write anything. Disabled in production builds.
 */
import { analyticsEnabled, config } from './config';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Monthly {
  month: string; visits: number; riskCompleted: number; learnStarted: number; learnCompleted: number;
  preAvg: number | null; postAvg: number | null; dangerKnownPct: number | null; satisfactionAvg: number | null;
}
export interface Stats {
  visits: number; pageViews: number; riskCompleted: number; riskCompletedFull: number;
  symptomOpened: number; helpOpened: number; learnStarted: number; learnCompleted: number;
  preAvg: number | null; preN: number; postAvg: number | null; postN: number;
  dangerKnownPct: number | null; dangerN: number;
  satisfactionAvg: number | null; satisfactionN: number; satisfactionDist: number[];
  topTopics: { topic: string; views: number }[];
  sources: { topic: string; views: number }[];
  monthly: Monthly[];
}
export interface EdRow { month: string; total_visits: number; nonurgent_visits: number; source: string }
export interface Approval { id: number; content_version: string; decision: 'approved' | 'changes_requested'; reviewer: string; notes: string; reviewed_at: string }

export type StaffRole = 'viewer' | 'editor';
export interface StaffSession { email: string; role: StaffRole }

export interface AdminApi {
  mode: 'supabase' | 'demo';
  getSession(): Promise<StaffSession | null>;
  signIn(email: string, password: string): Promise<StaffSession>;
  signOut(): Promise<void>;
  changePassword(newPassword: string): Promise<void>;
  stats(from: Date, to: Date, env: string): Promise<Stats>;
  ed(): Promise<EdRow[]>;
  saveEd(row: EdRow): Promise<void>;
  approvals(): Promise<Approval[]>;
  addApproval(a: Omit<Approval, 'id'>): Promise<void>;
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// ───────────────────────── Supabase
async function supabaseApi(): Promise<AdminApi> {
  const { createClient } = await import('@supabase/supabase-js');
  const sb: SupabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: true, storageKey: 'spj-admin' } });
  const must = <T,>(r: { data: T; error: unknown }) => { if (r.error) throw r.error; return r.data; };
  const whoami = async (): Promise<StaffRole | null> => {
    const { data, error } = await sb.rpc('admin_whoami');
    return !error && (data === 'viewer' || data === 'editor') ? data : null;
  };
  return {
    mode: 'supabase',
    async getSession() {
      const { data } = await sb.auth.getSession();
      if (!data.session) return null;
      const role = await whoami();
      if (!role) { await sb.auth.signOut(); return null; }
      return { email: data.session.user.email ?? '', role };
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error('invalid_credentials');
      const role = await whoami();
      if (!role) { await sb.auth.signOut(); throw new Error('not_authorized'); }
      return { email, role };
    },
    async signOut() { await sb.auth.signOut(); },
    async changePassword(newPassword) {
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    async stats(from, to, env) {
      const d = must(await sb.rpc('admin_stats', { p_from: from.toISOString(), p_to: to.toISOString(), p_env: env })) as any;
      return {
        ...d,
        preAvg: num(d.preAvg), postAvg: num(d.postAvg), dangerKnownPct: num(d.dangerKnownPct), satisfactionAvg: num(d.satisfactionAvg),
        monthly: (d.monthly ?? []).map((m: any) => ({ ...m, preAvg: num(m.preAvg), postAvg: num(m.postAvg), dangerKnownPct: num(m.dangerKnownPct), satisfactionAvg: num(m.satisfactionAvg) }))
      } as Stats;
    },
    async ed() {
      return (must(await sb.from('ed_monthly').select('month,total_visits,nonurgent_visits,source').order('month')) as any[])
        .map(r => ({ ...r, month: String(r.month).slice(0, 7) }));
    },
    async saveEd(row) {
      must(await sb.from('ed_monthly').upsert({ ...row, month: `${row.month}-01`, updated_at: new Date().toISOString() }));
    },
    async approvals() {
      return must(await sb.from('content_approvals').select('*').order('reviewed_at', { ascending: false })) as Approval[];
    },
    async addApproval(a) { must(await sb.from('content_approvals').insert(a)); }
  };
}

// ───────────────────────── Demo (sample data, in memory only)
function rng(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

function demoApi(): AdminApi {
  const r = rng(42);
  const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
  const monthly: Monthly[] = months.map((month, k) => {
    const visits = Math.round(260 + k * 85 + r() * 60);
    const learnStarted = Math.round(visits * (0.32 + r() * 0.06));
    return {
      month, visits,
      riskCompleted: Math.round(visits * (0.38 + r() * 0.05)),
      learnStarted, learnCompleted: Math.round(learnStarted * (0.62 + r() * 0.1)),
      preAvg: +(2.6 + r() * 0.4).toFixed(2), postAvg: +(4.0 + r() * 0.5).toFixed(2),
      dangerKnownPct: +(68 + k * 2 + r() * 6).toFixed(1), satisfactionAvg: +(4.2 + r() * 0.5).toFixed(2)
    };
  });
  const sum = (f: (m: Monthly) => number) => monthly.reduce((s, m) => s + f(m), 0);
  const visits = sum(m => m.visits);
  const stats: Stats = {
    visits, pageViews: Math.round(visits * 4.3),
    riskCompleted: sum(m => m.riskCompleted), riskCompletedFull: Math.round(sum(m => m.riskCompleted) * 0.81),
    symptomOpened: Math.round(visits * 0.22), helpOpened: Math.round(visits * 0.03),
    learnStarted: sum(m => m.learnStarted), learnCompleted: sum(m => m.learnCompleted),
    preAvg: 2.78, preN: Math.round(sum(m => m.learnStarted) * 0.7), postAvg: 4.21, postN: sum(m => m.learnCompleted),
    dangerKnownPct: 74.6, dangerN: sum(m => m.learnCompleted),
    satisfactionAvg: 4.46, satisfactionN: 6 + 11 + 48 + 190 + 410, satisfactionDist: [6, 11, 48, 190, 410],
    topTopics: [
      { topic: 'home', views: Math.round(visits * 1.2) }, { topic: 'risk', views: Math.round(visits * 0.62) },
      { topic: 'journey', views: Math.round(visits * 0.55) }, { topic: 'learn', views: Math.round(visits * 0.48) },
      { topic: 'emergency', views: Math.round(visits * 0.33) }, { topic: 'symptoms', views: Math.round(visits * 0.29) },
      { topic: 'where', views: Math.round(visits * 0.25) }, { topic: 'tips', views: Math.round(visits * 0.18) }
    ],
    sources: [
      { topic: 'obgyn-waiting', views: Math.round(visits * 0.41) }, { topic: 'er-waiting', views: Math.round(visits * 0.24) },
      { topic: 'outpatient', views: Math.round(visits * 0.15) }, { topic: 'phc', views: Math.round(visits * 0.1) },
      { topic: 'screens', views: Math.round(visits * 0.04) }, { topic: 'direct', views: Math.round(visits * 0.06) }
    ],
    monthly
  };
  const ed: EdRow[] = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'].map(m => {
    const total = Math.round(1900 + r() * 250);
    return { month: m, total_visits: total, nonurgent_visits: Math.round(total * (0.41 + r() * 0.05)), source: 'بيانات تجريبية' };
  });
  const approvals: Approval[] = [];
  return {
    mode: 'demo',
    // The demo has NO session and NO write capability. It cannot be used to sign in or approve anything.
    async getSession() { return null; },
    async signIn() { throw new Error('demo_read_only'); },
    async signOut() {},
    async changePassword() { throw new Error('demo_read_only'); },
    async stats() { return stats; },
    async ed() { return [...ed].sort((a, b) => a.month.localeCompare(b.month)); },
    async saveEd() { throw new Error('demo_read_only'); },
    async approvals() { return approvals; },
    async addApproval() { throw new Error('demo_read_only'); }
  };
}

let api: Promise<AdminApi> | null = null;
/** Real admin API. Returns null when Supabase is not configured — there is NO fallback to demo data. */
export function getAdminApi(): Promise<AdminApi> | null {
  if (!analyticsEnabled) return null;
  api ??= supabaseApi();
  return api;
}

/** Sample-data API for the separate demo dashboard only. */
export function getDemoApi(): AdminApi {
  return demoApi();
}
