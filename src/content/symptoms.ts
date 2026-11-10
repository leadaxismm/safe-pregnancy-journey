/**
 * Danger signs — exactly the 8 items from the source section
 * "علامات الخطر · اذهبي للطوارئ فورًا". `plain` is a simplified wording
 * for the interactive checker; `source` is the original text.
 */
export interface DangerSign {
  id: string;
  source: string;
  plain: string;
  icon: string; // lucide icon name, resolved in UI
}

export const dangerSigns: DangerSign[] = [
  { id: 'bleeding', source: 'نزيف من المهبل', plain: 'نزيف من المهبل', icon: 'Droplet' },
  { id: 'headache', source: 'صداع شديد أو زغللة في النظر', plain: 'صداع شديد، أو زغللة واضطراب في النظر', icon: 'Eye' },
  { id: 'movement', source: 'قلّة أو توقّف حركة الجنين', plain: 'حركة الجنين قلّت أو توقفت', icon: 'Baby' },
  { id: 'fluid', source: 'نزول ماء من المهبل', plain: 'نزول ماء أو سوائل من المهبل', icon: 'Waves' },
  { id: 'abdominal', source: 'ألم شديد في البطن أو طلق مبكر', plain: 'ألم شديد في البطن، أو طلق قبل موعده', icon: 'Zap' },
  { id: 'seizure', source: 'تشنّجات', plain: 'تشنّجات', icon: 'Activity' },
  { id: 'leg', source: 'ألم أو تورّم في ساق واحدة', plain: 'ألم أو تورّم في ساق واحدة', icon: 'Footprints' },
  { id: 'breath', source: 'ضيق في التنفس أو ألم في الصدر', plain: 'ضيق في التنفس، أو ألم في الصدر', icon: 'HeartPulse' }
];
