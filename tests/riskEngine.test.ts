import { describe, it, expect } from 'vitest';
import { evaluate, computeBmi, type Answer } from '../src/lib/riskEngine';
import { allFactors } from '../src/content/riskFactors';

const allNo = () => Object.fromEntries(allFactors.map(f => [f.id, 'no' as Answer]));
const base = { age: 28, heightCm: 160, weightKg: 60 };

describe('risk engine — safety rules', () => {
  it('shows NO tier when nothing is answered (never green by default)', () => {
    const r = evaluate({ age: null, heightCm: null, weightKg: null, answers: {} });
    expect(r.tier).toBeNull();
    expect(r.complete).toBe(false);
  });
  it('shows NO tier when one item is unanswered and nothing else found', () => {
    const a = allNo(); delete (a as any).r1;
    expect(evaluate({ ...base, answers: a }).tier).toBeNull();
  });
  it('"unsure" counts as incomplete, not as "no"', () => {
    const r = evaluate({ ...base, answers: { ...allNo(), a3: 'unsure' } });
    expect(r.complete).toBe(false);
    expect(r.tier).toBeNull();
  });
  it('green only when everything is answered with no factor', () => {
    const r = evaluate({ ...base, answers: allNo() });
    expect(r.complete).toBe(true);
    expect(r.tier).toBe('green');
  });
  it('red is shown even if incomplete (cannot be lowered by more answers)', () => {
    const r = evaluate({ age: null, heightCm: null, weightKg: null, answers: { r4: 'yes' } });
    expect(r.tier).toBe('red');
    expect(r.complete).toBe(false);
  });
});

describe('risk engine — source page rules', () => {
  const t = (over: Partial<typeof base>, answers: Record<string, Answer> = {}) =>
    evaluate({ ...base, ...over, answers: { ...allNo(), ...answers } });
  it('age ≥ 40 → red', () => expect(t({ age: 40 }).tier).toBe('red'));
  it('age 35–39 → amber', () => { expect(t({ age: 35 }).tier).toBe('amber'); expect(t({ age: 39 }).tier).toBe('amber'); });
  it('age < 18 → amber', () => expect(t({ age: 17 }).tier).toBe('amber'));
  it('age 18–34 → green', () => { expect(t({ age: 18 }).tier).toBe('green'); expect(t({ age: 34 }).tier).toBe('green'); });
  it('BMI ≥ 40 → red', () => expect(t({ heightCm: 160, weightKg: 103 }).tier).toBe('red'));
  it('BMI 30–<40 → amber', () => expect(t({ heightCm: 160, weightKg: 80 }).tier).toBe('amber'));
  it('BMI < 18 → amber', () => expect(t({ heightCm: 170, weightKg: 50 }).tier).toBe('amber'));
  it('any red item → red', () => expect(t({}, { r12: 'yes' }).tier).toBe('red'));
  it('1–2 amber → amber', () => expect(t({}, { a1: 'yes', a2: 'yes' }).tier).toBe('amber'));
  it('≥ 3 amber (incl. age) → hospital review', () => expect(t({ age: 36 }, { a1: 'yes', a3: 'yes' }).tier).toBe('hospitalReview'));
  it('red beats ≥3 amber', () => expect(t({}, { a1: 'yes', a2: 'yes', a3: 'yes', r1: 'yes' }).tier).toBe('red'));
  it('BMI computation', () => expect(computeBmi(160, 64)).toBe(25));
  it('out-of-range inputs are treated as missing', () => {
    expect(computeBmi(50, 60)).toBeNull();
    expect(t({ age: 5 }).tier).toBeNull();
  });
  it('22 checklist items, as in the source page', () => expect(allFactors.length).toBe(22));
});
