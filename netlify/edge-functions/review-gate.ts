/**
 * Review-only access gate for the PREVIEW deployment.
 * HTTP Basic auth checked at the edge (server-side) before any file is served.
 * The password is a Netlify secret env var (REVIEW_PASSWORD) — never in the repository.
 * Remove this function (or leave REVIEW_PASSWORD unset → 503) only for an approved public release.
 */
import type { Config, Context } from '@netlify/edge-functions';

function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export default async (req: Request, context: Context) => {
  const expectedUser = Netlify.env.get('REVIEW_USER') ?? 'review';
  const expectedPass = Netlify.env.get('REVIEW_PASSWORD');
  if (!expectedPass) return new Response('Review access is not configured.', { status: 503, headers: { 'Cache-Control': 'no-store' } });

  const h = req.headers.get('authorization') ?? '';
  if (h.startsWith('Basic ')) {
    try {
      const raw = atob(h.slice(6));
      const i = raw.indexOf(':');
      if (i > 0 && safeEqual(raw.slice(0, i), expectedUser) && safeEqual(raw.slice(i + 1), expectedPass)) {
        const res = await context.next();
        res.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return res;
      }
    } catch { /* fall through */ }
  }
  return new Response('نسخة مراجعة داخلية — الدخول لفريق المراجعة المخوّل فقط.\nInternal review build — authorised reviewers only.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Safe Pregnancy Journey review", charset="UTF-8"', 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
  });
};

export const config: Config = { path: '/*' };
