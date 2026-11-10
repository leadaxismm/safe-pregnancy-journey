/** Runtime configuration from Vite env (see .env.example). Only PUBLIC values belong here. */
export type AppEnv = 'preview' | 'production' | 'test';
const env = (import.meta.env.VITE_APP_ENV as string | undefined) ?? 'preview';

export const config = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') || '',
  /** publishable (anon) key — public by design; all access is enforced by RLS + RPC checks */
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '',
  publicUrl: (import.meta.env.VITE_PUBLIC_URL as string | undefined) || '',
  appEnv: (['preview', 'production', 'test'].includes(env) ? env : 'preview') as AppEnv,
  /** demo dashboard with sample numbers at #/admin-demo — never enabled in production */
  demoDashboard: import.meta.env.VITE_ENABLE_DEMO_DASHBOARD === 'true' && env !== 'production'
};
export const analyticsEnabled = Boolean(config.supabaseUrl && config.supabaseAnonKey);
