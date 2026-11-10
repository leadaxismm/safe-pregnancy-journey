/**
 * Antenatal timeline — the 11 steps of "خطوات المتابعة" in the source page.
 * Wording of `title` / `items` is the source wording. `tags` only classify
 * the existing items (tests, scans, vaccines…) so the UI can show icons/filters;
 * they add no new medical content.
 */
export type JourneyTag = 'appointment' | 'tests' | 'scan' | 'vaccine' | 'birth' | 'watch' | 'supplement' | 'risk';

export interface JourneyItem {
  text: string;
  tag: JourneyTag;
}

export interface JourneyStep {
  n: number;
  when: string;
  /** inclusive gestational-week range this step applies to; null = before the pregnancy is confirmed */
  weeks: [number, number] | null;
  title: string;
  items: JourneyItem[];
  key?: boolean;
}

export const tagLabel: Record<JourneyTag, string> = {
  appointment: 'مواعيد المتابعة',
  tests: 'التحاليل',
  scan: 'الأشعة (الموجات فوق الصوتية)',
  vaccine: 'التطعيمات',
  birth: 'الاستعداد للولادة',
  watch: 'انتبهي إلى',
  supplement: 'المكملات',
  risk: 'تقييم الخطورة'
};

export const journey: JourneyStep[] = [
  {
    n: 1, when: 'تشكّين بالحمل؟', weeks: null,
    title: 'احجزي موعدًا في تطبيق «صحتي»',
    items: [{ text: 'عيادة طب الأسرة لعمل فحص الحمل', tag: 'appointment' }]
  },
  {
    n: 2, when: 'الفحص إيجابي', weeks: null,
    title: 'تحويلك لعيادة متابعة الحمل',
    items: [{ text: 'يكون موعدك خلال 14 يومًا', tag: 'appointment' }]
  },
  {
    n: 3, when: 'الزيارة الأولى · قبل 12 أسبوعًا', weeks: [1, 12], key: true,
    title: 'أهم زيارة',
    items: [
      { text: 'تحاليل الدم والبول وفصيلة الدم', tag: 'tests' },
      { text: 'تقييم درجة خطورة الحمل (أخضر / برتقالي / أحمر)', tag: 'risk' },
      { text: 'حمض الفوليك وفيتامين د', tag: 'supplement' }
    ]
  },
  {
    n: 4, when: '11 – 13 أسبوعًا و6 أيام', weeks: [11, 14],
    title: 'أشعة تحديد عمر الحمل + أشعة الشفافية القفوية (NT)',
    items: [
      { text: 'أشعة NT: قياس سُمك خلف رقبة الجنين للكشف المبكر عن بعض المشاكل الخِلقية', tag: 'scan' },
      { text: 'مراجعة نتائج التحاليل (12 – 14 أسبوعًا)', tag: 'tests' },
      { text: 'العناية بالفم والأسنان', tag: 'watch' }
    ]
  },
  {
    n: 5, when: '18 – 22 أسبوعًا', weeks: [18, 22],
    title: 'أشعة فحص سلامة الجنين',
    items: [{ text: 'ومعرفة مكان المشيمة', tag: 'scan' }]
  },
  {
    n: 6, when: '24 – 28 أسبوعًا', weeks: [24, 28],
    title: 'فحص سكر الحمل',
    items: [
      { text: 'فحص سكر الحمل', tag: 'tests' },
      { text: 'انتبهي لحركة الجنين كل يوم', tag: 'watch' }
    ]
  },
  {
    n: 7, when: '28 أسبوعًا', weeks: [28, 28],
    title: 'التطعيمات وفحص الدم',
    items: [
      { text: 'الإنفلونزا، الكزاز والسعال الديكي، والفيروس التنفسي المخلوي', tag: 'vaccine' },
      { text: 'إبرة «Anti-D» إذا فصيلة دمك سالبة', tag: 'vaccine' },
      { text: 'نبدأ الحديث عن خطة الولادة والرضاعة', tag: 'birth' }
    ]
  },
  {
    n: 8, when: '30 – 32 أسبوعًا', weeks: [30, 32],
    title: 'الاستعداد للولادة',
    items: [{ text: 'تعرّفي على علامات الخطر ومتى تذهبين للمستشفى', tag: 'birth' }]
  },
  {
    n: 9, when: '34 أسبوعًا', weeks: [34, 34], key: true,
    title: 'آخر زيارة في المركز الصحي',
    items: [
      { text: 'تحويلك للمستشفى مع ملفك كاملًا', tag: 'appointment' },
      { text: 'موعد بعد الولادة بـ 6 – 8 أسابيع', tag: 'appointment' }
    ]
  },
  {
    n: 10, when: 'من 35 أسبوعًا', weeks: [35, 42],
    title: 'متابعة أسبوعية في المستشفى',
    items: [
      { text: 'متابعة أسبوعية في المستشفى', tag: 'appointment' },
      { text: 'مسحة «GBS» بين 36 و 37 أسبوعًا', tag: 'tests' }
    ]
  },
  {
    n: 11, when: '40 أسبوعًا', weeks: [40, 42],
    title: 'موعد الولادة',
    items: [{ text: 'إذا لم تبدأ الولادة يناقش الطبيب معك تحريض الولادة', tag: 'birth' }]
  }
];

export const highRiskNote =
  'إذا كان حملك عالي الخطورة سيكون لك مسار متابعة مختلف، ويشرح لك طبيبك المواعيد والفحوصات الخاصة بك.';

/** Steps that apply to a given week, and the next upcoming step. */
export function stepsForWeek(week: number) {
  const current = journey.filter(s => s.weeks && week >= s.weeks[0] && week <= s.weeks[1]);
  const next = journey.find(s => s.weeks && s.weeks[0] > week);
  return { current, next };
}
