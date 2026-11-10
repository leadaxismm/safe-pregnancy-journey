import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { contentMeta } from '../src/content/meta';

const run = (env: string) => spawnSync('node', ['scripts/check-content.mjs'], { env: { ...process.env, VITE_APP_ENV: env }, encoding: 'utf8' });

describe('medical content governance', () => {
  it('content stays in draft until clinical sign-off', () => {
    expect(contentMeta.status).toBe('draft');
    expect(contentMeta.lastClinicalReview).toBeNull();
    expect(contentMeta.approvedBy).toBeNull();
  });
  it('preview build is allowed', () => expect(run('preview').status).toBe(0));
  it('production build is refused while not approved', () => {
    const r = run('production');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('refusing a production build');
  });
  it('keeps original organisation and source names', () => {
    expect(contentMeta.organization).toBe('تجمع حفر الباطن الصحي');
    expect(contentMeta.sourceTitle).toContain('MC0526_08');
    expect(contentMeta.sourcePageAuthor).toBe('د. بدر السهلي');
  });
});
