/**
 * Anonymous, aggregate-only usage analytics.
 *
 * Privacy rules (project brief §11):
 *  - No names, ID numbers, medical record numbers, IP addresses or device fingerprints.
 *  - NO individual questionnaire or symptom answers are ever sent — only that a tool was used/completed.
 *  - session_id is a random value kept in sessionStorage (dies with the tab), used only to count
 *    visits and completion rates.
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

function sessionId(): string {
  try {
    let id = sessionStorage.getItem('spj-sid');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('spj-sid', id);
    }
    return id;
  } catch {
    return 'no-storage';
  }
}

export function track(event: EventName, opts: { topic?: string; value?: number } = {}) {
  if (!analyticsEnabled) {
    if (import.meta.env.DEV) console.debug('[analytics:off]', event, opts);
    return;
  }
  const body = JSON.stringify({ session_id: sessionId(), event, topic: opts.topic ?? null, value: opts.value ?? null });
  fetch(`${config.supabaseUrl}/rest/v1/events`, {
    method: 'POST',
    keepalive: true,
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body
  }).catch(() => { /* analytics must never break the patient experience */ });
}

let visited = false;
export function trackVisitOnce() {
  if (visited) return;
  visited = true;
  try {
    if (sessionStorage.getItem('spj-visited')) return;
    sessionStorage.setItem('spj-visited', '1');
  } catch { /* ignore */ }
  // Which QR poster brought the visitor (whitelisted values only), e.g. ?src=er-waiting
  let src = 'direct';
  try {
    const p = new URLSearchParams(window.location.search).get('src');
    if (p && qrLocations.some(l => l.id === p)) src = p;
  } catch { /* ignore */ }
  track('visit', { topic: src });
}
