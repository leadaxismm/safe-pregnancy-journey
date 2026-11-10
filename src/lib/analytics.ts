/**
 * Anonymous, aggregate-only usage analytics (v0.2).
 *
 * Privacy rules:
 *  - No names, ID numbers, record numbers, IP addresses, device fingerprints or session identifiers are sent.
 *  - NO questionnaire or symptom answers are ever sent — only that a tool was used/completed.
 *  - Events go through the server function `log_event`, which validates every field and throttles floods.
 *    The browser has no direct write access to any table.
 *  - Each event is tagged with the build environment (preview / production / test) so test data never mixes with real data.
 * If Supabase is not configured, every call is a no-op.
 */
import { analyticsEnabled, config } from './config';
import { qrLocations } from '../content/locations';

export type EventName =
  | 'visit'
  | 'page_view'
  | 'risk_check_completed'   // value: 1 = all answered, 0 = finished with gaps (answers themselves are NOT sent)
  | 'symptom_checker_opened'
  | 'help_opened'
  | 'learn_started'
  | 'learn_completed'
  | 'quiz_pre'               // value: score 0–5
  | 'quiz_post'              // value: score 0–5
  | 'quiz_danger_known'      // value: 1 if all danger-sign questions correct on post-test
  | 'satisfaction';          // value: 1–5

const PAGE_TOPICS = new Set(['home', 'journey', 'risk', 'symptoms', 'emergency', 'where', 'tips', 'learn', 'about']);

export function track(event: EventName, opts: { topic?: string; value?: number } = {}) {
  if (event === 'page_view' && (!opts.topic || !PAGE_TOPICS.has(opts.topic))) return; // unknown pages are not logged
  if (!analyticsEnabled) {
    if (import.meta.env.DEV) console.debug('[analytics:off]', event, opts);
    return;
  }
  const body = JSON.stringify({ p_event: event, p_topic: opts.topic ?? null, p_value: opts.value ?? null, p_env: config.appEnv });
  fetch(`${config.supabaseUrl}/rest/v1/rpc/log_event`, {
    method: 'POST',
    keepalive: true,
    credentials: 'omit',
    headers: { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body
  }).catch(() => { /* analytics must never break the patient experience */ });
}

/** One "visit" per browser tab. The flag stays in this tab only and is never sent. */
export function trackVisitOnce() {
  try {
    if (sessionStorage.getItem('spj-visited')) return;
    sessionStorage.setItem('spj-visited', '1');
  } catch { /* storage blocked: still count once per page load */ }
  let src = 'direct';
  try {
    const p = new URLSearchParams(window.location.search).get('src');
    if (p && qrLocations.some(l => l.id === p)) src = p;
  } catch { /* ignore */ }
  track('visit', { topic: src });
}
