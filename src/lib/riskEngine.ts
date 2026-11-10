/**
 * Educational risk-tier engine.
 *
 * Reproduces the rules of the source page's calc() function, with two safety changes
 * requested in the project brief:
 *   1. No tier is shown by default. Unanswered / "لا أعرف" answers make the result
 *      INCOMPLETE, and an incomplete result is never shown as green.
 *   2. The result is educational, never a diagnosis or a placement decision.
 *
 * This engine does NOT look at current symptoms. Symptoms are handled separately
 * (see pages/Emergency.tsx) and always take priority.
 */
import { allFactors, thresholds, type RiskFactor } from '../content/riskFactors';

export type Answer = 'yes' | 'no' | 'unsure';

export interface RiskInput {
  age: number | null;          // years; null = not answered
  heightCm: number | null;
  weightKg: number | null;
  answers: Record<string, Answer | undefined>;
}

export type ResultTier = 'green' | 'amber' | 'hospitalReview' | 'red';

export interface Finding {
  id: string;
  tier: 'red' | 'amber';
  text: string;
}

export interface RiskResult {
  complete: boolean;
  /** what is still missing, in plain Arabic */
  missing: string[];
  findings: Finding[];
  redCount: number;
  amberCount: number;
  /** exact BMI (unrounded) */
  bmi: number | null;
  /**
   * FINAL educational tier. Only given when every answer is known — except red, which is
   * shown even when incomplete because more answers can never lower it. Never green when incomplete.
   */
  tier: ResultTier | null;
  /**
   * Level already CONFIRMED by the "yes" answers given so far (null if no factor found).
   * Adding answers can only raise it, never lower it, so it is safe to show as "at least".
   * Never 'green': the absence of an answer is not evidence of low risk.
   */
  knownLevel: Exclude<ResultTier, 'green'> | null;
  /** checklist items answered «لا أعرف» — kept as unknown, never treated as «لا» */
  unsureIds: string[];
  /** checklist items not answered at all */
  unansweredIds: string[];
  missingAge: boolean;
  missingBody: boolean;
}

export const validRanges = {
  age: [12, 60] as const,
  heightCm: [120, 210] as const,
  weightKg: [30, 250] as const
};

export function inRange(v: number | null, [min, max]: readonly [number, number]) {
  return v !== null && Number.isFinite(v) && v >= min && v <= max;
}

/**
 * Strict number parsing for user input. Accepts Western or Arabic-Indic digits and
 * "." or "٫" as decimal separator. Anything else (letters, signs, empty) → null.
 */
export function parseNumber(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim()
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٫,]/g, '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Age must be whole years within range. */
export function validAge(age: number | null): boolean {
  return inRange(age, validRanges.age) && Number.isInteger(age);
}

/**
 * Exact (unrounded) BMI. Thresholds are ALWAYS applied to this value.
 * Fix (v0.2): v0.1 rounded to 1 decimal before comparing, so e.g. 29.96 was classed as ≥30.
 */
export function computeBmi(heightCm: number | null, weightKg: number | null): number | null {
  if (!inRange(heightCm, validRanges.heightCm) || !inRange(weightKg, validRanges.weightKg)) return null;
  // weight×10000 / height² avoids the binary error of (h/100)² (e.g. 76.8 / 1.6² = 29.999999999999993).
  // The 1e-9 clean-up removes only floating-point noise; it is not clinical rounding.
  const raw = ((weightKg as number) * 10000) / ((heightCm as number) * (heightCm as number));
  return Math.round(raw * 1e9) / 1e9;
}

/**
 * BMI for display only: truncated (not rounded) to 1 decimal so the shown number
 * never crosses a threshold the exact value did not cross (29.96 → "29.9", not "30.0").
 */
export function displayBmi(bmi: number): string {
  return (Math.floor(bmi * 10 + 1e-9) / 10).toFixed(1);
}

export function evaluate(input: RiskInput): RiskResult {
  const findings: Finding[] = [];
  const missing: string[] = [];

  // Age
  const ageOk = validAge(input.age);
  if (!ageOk) missing.push('العمر');
  else {
    const age = input.age as number;
    if (age >= thresholds.ageRed) findings.push({ id: 'age', tier: 'red', text: `العمر ${age} سنة (40 سنة أو أكثر)` });
    else if (age < thresholds.ageAmberUnder) findings.push({ id: 'age', tier: 'amber', text: `العمر ${age} سنة (أقل من 18 سنة)` });
    else if (age >= thresholds.ageAmberFrom) findings.push({ id: 'age', tier: 'amber', text: `العمر ${age} سنة (من 35 إلى 39 سنة)` });
  }

  // BMI
  const bmi = computeBmi(input.heightCm, input.weightKg);
  if (bmi === null) missing.push('الطول والوزن');
  else {
    const shown = displayBmi(bmi);
    if (bmi >= thresholds.bmiRed) findings.push({ id: 'bmi', tier: 'red', text: `مؤشر كتلة الجسم ${shown} (40 أو أكثر)` });
    else if (bmi >= thresholds.bmiAmberFrom) findings.push({ id: 'bmi', tier: 'amber', text: `مؤشر كتلة الجسم ${shown} (من 30 إلى أقل من 40)` });
    else if (bmi < thresholds.bmiAmberUnder) findings.push({ id: 'bmi', tier: 'amber', text: `مؤشر كتلة الجسم ${shown} (أقل من 18)` });
  }

  // Checklist items
  const unsureIds: string[] = [];
  const unansweredIds: string[] = [];
  allFactors.forEach((f: RiskFactor) => {
    const a = input.answers[f.id];
    if (a === 'yes') findings.push({ id: f.id, tier: f.tier, text: f.text });
    else if (a === 'unsure') unsureIds.push(f.id);
    else if (a !== 'no') unansweredIds.push(f.id);
  });
  const unanswered = unansweredIds.length;
  const unsure = unsureIds.length;
  if (unanswered) missing.push(`${unanswered} ${unanswered === 1 ? 'سؤال لم تتم الإجابة عنه' : unanswered === 2 ? 'سؤالان لم تتم الإجابة عنهما' : 'أسئلة لم تتم الإجابة عنها'}`);
  if (unsure) missing.push(`${unsure} ${unsure === 1 ? 'إجابة' : 'إجابات'} «لا أعرف»`);

  const redCount = findings.filter(f => f.tier === 'red').length;
  const amberCount = findings.filter(f => f.tier === 'amber').length;
  const complete = missing.length === 0;

  // Level confirmed by the factors found so far (same rules as the source page, applied to "yes" answers only)
  let knownLevel: RiskResult['knownLevel'] = null;
  if (redCount > 0) knownLevel = 'red';
  else if (amberCount >= thresholds.amberCountForHospitalReview) knownLevel = 'hospitalReview';
  else if (amberCount > 0) knownLevel = 'amber';

  // Final tier: only when complete — except red, which can never be lowered by more answers.
  let tier: ResultTier | null;
  if (redCount > 0) tier = 'red';
  else if (!complete) tier = null;
  else tier = knownLevel ?? 'green';

  // Safety invariant: an incomplete result is never green.
  if (!complete && tier === 'green') tier = null;
  return { complete, missing, findings, redCount, amberCount, bmi, tier, knownLevel, unsureIds, unansweredIds, missingAge: !ageOk, missingBody: bmi === null };
}
