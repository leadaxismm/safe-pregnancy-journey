/** Runtime configuration from Vite env (see .env.example). */
export const config = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') || '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '',
  /** Public URL printed on QR posters, e.g. https://spj.example.sa */
  publicUrl: (import.meta.env.VITE_PUBLIC_URL as string | undefined) || ''
};
export const analyticsEnabled = Boolean(config.supabaseUrl && config.supabaseAnonKey);
