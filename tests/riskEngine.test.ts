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
  it('BMI computation', () => expect(computeBmi(160, 64)).toBeCloseTo(25, 10));
  it('out-of-range inputs are treated as missing', () => {
    expect(computeBmi(50, 60)).toBeNull();
    expect(t({ age: 5 }).tier).toBeNull();
  });
  it('22 checklist items, as in the source page', () => expect(allFactors.length).toBe(22));
});

import { parseNumber, displayBmi, validAge } from '../src/lib/riskEngine';

describe('v0.2 fixes — BMI is never rounded before thresholds', () => {
  const t = (heightCm: number, weightKg: number) => evaluate({ age: 28, heightCm, weightKg, answers: allNo() });
  // 160 cm: BMI 30 ↔ 76.8 kg, 40 ↔ 102.4 kg
  it('BMI 29.96 (just under 30) → green, not amber', () => {
    const r = t(160, 76.7); // 29.96
    expect(r.bmi!).toBeLessThan(30); expect(r.tier).toBe('green');
  });
  it('BMI exactly 30.0 → amber', () => expect(t(160, 76.8).tier).toBe('amber'));
  it('BMI 39.98 → amber, not red', () => { const r = t(160, 102.35); expect(r.bmi!).toBeLessThan(40); expect(r.tier).toBe('amber'); });
  it('BMI exactly 40 → red', () => expect(t(160, 102.4).tier).toBe('red'));
  it('BMI 17.98 (just under 18) → amber', () => { const r = t(170, 51.97); expect(r.bmi!).toBeLessThan(18); expect(r.tier).toBe('amber'); });
  it('BMI exactly 18.0 → green', () => expect(t(170, 52.02).tier).toBe('green'));
  it('display truncates so it never crosses a threshold', () => {
    expect(displayBmi(29.96)).toBe('29.9'); expect(displayBmi(39.999)).toBe('39.9'); expect(displayBmi(30)).toBe('30.0'); expect(displayBmi(17.99)).toBe('17.9');
  });
  it('bmi finding text uses the display value', () => {
    expect(t(160, 76.8).findings.find(f => f.id === 'bmi')!.text).toContain('30.0');
  });
});

describe('v0.2 fixes — age boundaries and invalid input', () => {
  const t = (age: number | null) => evaluate({ age, heightCm: 160, weightKg: 60, answers: allNo() });
  it('39 amber, 40 red, 34 green, 35 amber, 17 amber, 18 green', () => {
    expect(t(39).tier).toBe('amber'); expect(t(40).tier).toBe('red'); expect(t(34).tier).toBe('green');
    expect(t(35).tier).toBe('amber'); expect(t(17).tier).toBe('amber'); expect(t(18).tier).toBe('green');
  });
  it('range limits 12 and 60 accepted; 11 and 61 → missing', () => {
    expect(t(12).complete).toBe(true); expect(t(60).complete).toBe(true);
    expect(t(11).tier).toBeNull(); expect(t(61).tier).toBeNull();
  });
  it('non-integer age (39.5) is invalid → incomplete, never silently classified', () => {
    const r = t(39.5); expect(r.complete).toBe(false); expect(validAge(39.5)).toBe(false);
  });
  it('NaN / Infinity are invalid', () => { expect(t(NaN).tier).toBeNull(); expect(t(Infinity).tier).toBeNull(); });
  it('height/weight out of range → BMI missing', () => {
    expect(evaluate({ age: 28, heightCm: 119, weightKg: 60, answers: allNo() }).missing).toContain('الطول والوزن');
    expect(evaluate({ age: 28, heightCm: 160, weightKg: 251, answers: allNo() }).tier).toBeNull();
  });
  it('only height given → incomplete', () => expect(evaluate({ age: 28, heightCm: 160, weightKg: null, answers: allNo() }).tier).toBeNull());
});

describe('v0.2 fixes — strict number parsing', () => {
  it.each([
    ['28', 28], [' 28 ', 28], ['٢٨', 28], ['۲۸', 28], ['65.5', 65.5], ['65٫5', 65.5], ['65,5', 65.5]
  ])('parses %s', (i, o) => expect(parseNumber(i)).toBe(o));
  it.each(['', '  ', '28abc', 'abc', '-5', '+5', '1e2', '2..5', '.5', null, undefined])('rejects %s', i => expect(parseNumber(i as any)).toBeNull());
});

describe('v0.2 — answers & separation from symptoms', () => {
  it('bogus answer values count as unanswered', () => {
    const r = evaluate({ age: 28, heightCm: 160, weightKg: 60, answers: { ...allNo(), r1: 'maybe' as any } });
    expect(r.tier).toBeNull();
  });
  it('all "unsure" → incomplete with no tier', () => {
    const a = Object.fromEntries(allFactors.map(f => [f.id, 'unsure' as Answer]));
    const r = evaluate({ age: 28, heightCm: 160, weightKg: 60, answers: a });
    expect(r.tier).toBeNull(); expect(r.missing.join(' ')).toContain('لا أعرف');
  });
  it('≥3 amber while incomplete → hospital review shown with incomplete flag', () => {
    const r = evaluate({ age: 36, heightCm: 160, weightKg: 80, answers: { a1: 'yes' } });
    expect(r.tier).toBe('hospitalReview'); expect(r.complete).toBe(false);
  });
  it('engine input has no symptom fields (risk tier is independent of current symptoms)', () => {
    const r = evaluate({ age: 28, heightCm: 160, weightKg: 60, answers: allNo() }) as any;
    expect(Object.keys(r)).not.toContain('symptoms');
  });
  it('never returns green when incomplete (property check over 500 random inputs)', () => {
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const opts: (Answer | undefined)[] = ['yes', 'no', 'unsure', undefined, 'no', 'no'];
    for (let k = 0; k < 500; k++) {
      const answers = Object.fromEntries(allFactors.map(f => [f.id, opts[Math.floor(rnd() * opts.length)]]));
      const r = evaluate({ age: rnd() > .1 ? Math.floor(10 + rnd() * 55) : null, heightCm: rnd() > .1 ? 115 + rnd() * 100 : null, weightKg: rnd() > .1 ? 25 + rnd() * 120 : null, answers });
      if (!r.complete) expect(r.tier).not.toBe('green');
      if (r.redCount > 0) expect(r.tier).toBe('red');
    }
  });
});
