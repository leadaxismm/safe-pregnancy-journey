#!/usr/bin/env node
/**
 * Medical-content governance gate (runs before every build).
 *  - Hashes every medical content file in src/content (except meta.ts).
 *  - If meta.status === 'approved': lastClinicalReview, approvedBy and approvedContentHash must be set,
 *    and the hash must equal the current content → any edit after approval fails the build until re-approved.
 *  - A production build (VITE_APP_ENV=production) is refused unless status === 'approved'.
 * Nothing here can flip the status to approved: that is a deliberate human edit after clinical sign-off.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../src/content/', import.meta.url).pathname;
const files = readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'meta.ts').sort();
const h = createHash('sha256');
for (const f of files) h.update(f + '\0' + readFileSync(join(dir, f), 'utf8').replace(/\r\n/g, '\n') + '\0');
const hash = h.digest('hex');

const meta = readFileSync(join(dir, 'meta.ts'), 'utf8');
const pick = k => { const m = meta.match(new RegExp(`${k}:\\s*('([^']*)'|null)`)); return m && m[2] !== undefined ? m[2] : null; };
const status = (meta.match(/status:\s*'(\w+)'/) || [])[1];
const version = pick('version');
const env = process.env.VITE_APP_ENV || 'preview';

const fail = msg => { console.error(`\n✖ content governance: ${msg}\n`); process.exit(1); };
console.log(`content governance: version=${version} status=${status} env=${env}\n  content hash ${hash}`);

if (!['draft', 'in_review', 'approved'].includes(status)) fail(`unknown status "${status}"`);
if (status === 'approved') {
  if (!pick('lastClinicalReview') || !pick('approvedBy')) fail('status is approved but lastClinicalReview / approvedBy is empty');
  const approved = pick('approvedContentHash');
  if (approved !== hash) fail(`medical content changed after approval (approvedContentHash ${approved} ≠ ${hash}). Re-review and update meta.ts.`);
}
if (env === 'production' && status !== 'approved') fail(`refusing a production build: content status is "${status}" (must be approved by the clinical team)`);
console.log('  ✓ ok');
