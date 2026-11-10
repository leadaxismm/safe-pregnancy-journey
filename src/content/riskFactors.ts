/**
 * Risk factors — the 22 checklist items of "اعرفي درجة خطورة حملك" in the source page,
 * with their tier exactly as coded there (data-l="r" → red, data-l="a" → amber).
 * Grouping into sections is for usability only.
 *
 * ⚠️ Every item, tier and threshold here must be confirmed by the clinical team
 *    before real use (docs/CLINICAL_REVIEW.md §2).
 */
export type Tier = 'red' | 'amber';

export interface RiskFactor {
  id: string;
  tier: Tier;
  text: string;
}

export interface RiskSection {
  id: string;
  title: string;
  hint: string;
  factors: RiskFactor[];
}

export const riskSections: RiskSection[] = [
  {
    id: 'chronic',
    title: 'الأمراض المزمنة والتاريخ المرضي',
    hint: 'أمراض تشخّصت لديكِ قبل هذا الحمل أو تتلقين لها علاجًا.',
    factors: [
      { id: 'r1', tier: 'red', text: 'سكري قبل الحمل، أو سكر حمل يحتاج إنسولين' },
      { id: 'r2', tier: 'red', text: 'ضغط مزمن تأخذين له علاجًا' },
      { id: 'r3', tier: 'red', text: 'مرض في القلب أو الكلى أو الكبد، أو صرع على علاج' },
      { id: 'r4', tier: 'red', text: 'جلطة دم سابقة' },
      { id: 'r5', tier: 'red', text: 'أنيميا منجلية أو ثلاسيميا، أو التهاب كبد ب / ج' },
      { id: 'r6', tier: 'red', text: 'أمراض مناعية مثل الذئبة' },
      { id: 'r7', tier: 'red', text: 'مرض نفسي على علاج' },
      { id: 'r8', tier: 'red', text: 'عملية سابقة لإنقاص الوزن (تكميم أو تحويل مسار)' },
      { id: 'a6', tier: 'amber', text: 'غدة درقية خاملة تأخذين لها علاجًا' },
      { id: 'a9', tier: 'amber', text: 'عملية سابقة في عنق الرحم' }
    ]
  },
  {
    id: 'obstetric',
    title: 'الحمل والولادات السابقة',
    hint: 'ما حدث في حملٍ أو ولادةٍ سابقة. إن كان هذا حملك الأول، اختاري «لا».',
    factors: [
      { id: 'r9', tier: 'red', text: 'وفاة جنين أو مولود سابقًا، أو ولادة قبل 34 أسبوعًا' },
      { id: 'r10', tier: 'red', text: 'تسمّم حمل شديد في حمل سابق' },
      { id: 'r11', tier: 'red', text: '3 إجهاضات متتالية أو أكثر' },
      { id: 'a1', tier: 'amber', text: 'ولادة قيصرية سابقة واحدة' },
      { id: 'a7', tier: 'amber', text: 'طفل سابق وزنه أقل من 2.5 كجم' },
      { id: 'a8', tier: 'amber', text: 'ولادة مبكرة سابقة بين 34 و37 أسبوعًا' }
    ]
  },
  {
    id: 'current',
    title: 'الحمل الحالي',
    hint: 'معلومات عن هذا الحمل أخبرك بها الطبيب أو الفريق الصحي.',
    factors: [
      { id: 'r12', tier: 'red', text: 'توأم بمشيمة واحدة، أو 3 أجنّة أو أكثر' },
      { id: 'a2', tier: 'amber', text: 'حامل بتوأم (لكل جنين مشيمة)' },
      { id: 'a3', tier: 'amber', text: 'حمل بأطفال الأنابيب' },
      { id: 'r13', tier: 'red', text: 'أخبرك الطبيب بوجود تشوّه في الجنين' },
      { id: 'a4', tier: 'amber', text: 'أخبرك الطبيب أن ضغطك مرتفع في هذا الحمل' },
      { id: 'a5', tier: 'amber', text: 'سكر حمل يُعالج بالحمية فقط' }
    ]
  }
];

export const allFactors: RiskFactor[] = riskSections.flatMap(s => s.factors);

/** Thresholds exactly as coded in the source page's calc() function. */
export const thresholds = {
  ageRed: 40,          // age >= 40 → red
  ageAmberUnder: 18,   // age < 18 → amber
  ageAmberFrom: 35,    // 35 ≤ age < 40 → amber
  bmiRed: 40,          // BMI >= 40 → red
  bmiAmberFrom: 30,    // 30 ≤ BMI < 40 → amber
  bmiAmberUnder: 18,   // BMI < 18 → amber   (⚠ review: many guides use 18.5)
  amberCountForHospitalReview: 3 // ≥ 3 amber factors → one-time hospital OB review
};

/** Usual follow-up path per tier — wording from the source page. */
export const tierInfo = {
  green: {
    title: 'أخضر · حمل منخفض الخطورة',
    place: 'المركز الصحي · طبيب المركز أو القابلة',
    usual: 'عادةً تكون متابعة الحمل منخفض الخطورة في المركز الصحي.'
  },
  amber: {
    title: 'برتقالي · خطورة متوسطة',
    place: 'مركز صحي متخصص · طبيب نساء وولادة',
    usual: 'قد تحتاجين إلى متابعة متخصصة في مركز صحي متخصص مع طبيب النساء والولادة، وفق التقييم السريري.'
  },
  hospitalReview: {
    title: 'تقييم في المستشفى لتحديد مكان المتابعة',
    place: 'المستشفى · طبيب نساء وولادة (مرة واحدة)',
    usual: 'عند وجود 3 عوامل متوسطة أو أكثر، يكون المعتاد تحويلك لطبيب النساء والولادة في المستشفى مرة واحدة ليحدد مكان متابعتك.'
  },
  red: {
    title: 'أحمر · خطورة عالية',
    place: 'المستشفى · طبيب نساء وولادة',
    usual: 'توجد عوامل تستدعي تقييمًا متخصصًا في المستشفى مع طبيب النساء والولادة لتحديد خطة المتابعة. سيكون لكِ مسار متابعة مختلف.'
  }
};
