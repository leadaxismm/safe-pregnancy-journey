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
 * (see pages/Symptoms.tsx) and always take priority.
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
  bmi: number | null;
  /**
   * Tier to display. null when the answers are incomplete and nothing red was found —
   * in that case the UI must NOT show any colour.
   * When incomplete but a red factor exists, red is shown (adding answers cannot lower it).
   */
  tier: ResultTier | null;
}

export const validRanges = {
  age: [12, 60] as const,
  heightCm: [120, 210] as const,
  weightKg: [30, 250] as const
};

export function inRange(v: number | null, [min, max]: readonly [number, number]) {
  return v !== null && Number.isFinite(v) && v >= min && v <= max;
}

export function computeBmi(heightCm: number | null, weightKg: number | null): number | null {
  if (!inRange(heightCm, validRanges.heightCm) || !inRange(weightKg, validRanges.weightKg)) return null;
  const m = (heightCm as number) / 100;
  return Math.round(((weightKg as number) / (m * m)) * 10) / 10;
}

export function evaluate(input: RiskInput): RiskResult {
  const findings: Finding[] = [];
  const missing: string[] = [];

  // Age
  const ageOk = inRange(input.age, validRanges.age);
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
    if (bmi >= thresholds.bmiRed) findings.push({ id: 'bmi', tier: 'red', text: `مؤشر كتلة الجسم ${bmi} (40 أو أكثر)` });
    else if (bmi >= thresholds.bmiAmberFrom) findings.push({ id: 'bmi', tier: 'amber', text: `مؤشر كتلة الجسم ${bmi} (من 30 إلى أقل من 40)` });
    else if (bmi < thresholds.bmiAmberUnder) findings.push({ id: 'bmi', tier: 'amber', text: `مؤشر كتلة الجسم ${bmi} (أقل من 18)` });
  }

  // Checklist items
  let unanswered = 0;
  let unsure = 0;
  allFactors.forEach((f: RiskFactor) => {
    const a = input.answers[f.id];
    if (a === 'yes') findings.push({ id: f.id, tier: f.tier, text: f.text });
    else if (a === 'unsure') unsure++;
    else if (a !== 'no') unanswered++;
  });
  if (unanswered) missing.push(`${unanswered} ${unanswered === 1 ? 'سؤال لم تتم الإجابة عنه' : unanswered === 2 ? 'سؤالان لم تتم الإجابة عنهما' : 'أسئلة لم تتم الإجابة عنها'}`);
  if (unsure) missing.push(`${unsure} ${unsure === 1 ? 'إجابة' : 'إجابات'} «لا أعرف»`);

  const redCount = findings.filter(f => f.tier === 'red').length;
  const amberCount = findings.filter(f => f.tier === 'amber').length;
  const complete = missing.length === 0;

  let tier: ResultTier | null;
  if (redCount > 0) tier = 'red';
  else if (amberCount >= thresholds.amberCountForHospitalReview) tier = 'hospitalReview';
  else if (!complete) tier = null;
  else if (amberCount > 0) tier = 'amber';
  else tier = 'green';

  return { complete, missing, findings, redCount, amberCount, bmi, tier };
}
