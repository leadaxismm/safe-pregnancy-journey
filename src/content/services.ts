/**
 * "أين أتابع حملي؟" — built only from the follow-up pathway stated in the source page.
 * No booking links or operational details (addresses, hours, phone extensions) are invented.
 * Add the hospital's own official channels to `officialChannels` only after they are verified.
 */
export interface Service {
  id: string;
  name: string;
  icon: string;
  tone: 'calm' | 'brand' | 'amber' | 'urgent';
  role: string;
  usuallyFor: string[];
}

export const services: Service[] = [
  {
    id: 'phc',
    name: 'مراكز الرعاية الصحية الأولية',
    icon: 'Building2',
    tone: 'calm',
    role: 'نقطة البداية والمتابعة المعتادة للحمل منخفض الخطورة، مع طبيب المركز أو القابلة.',
    usuallyFor: [
      'عند الشك بالحمل: عيادة طب الأسرة لعمل فحص الحمل (بالحجز عبر تطبيق «صحتي»)',
      'متابعة الحمل المصنّف «أخضر» (منخفض الخطورة)',
      'الزيارات حتى 34 أسبوعًا، ثم التحويل للمستشفى مع ملفك كاملًا'
    ]
  },
  {
    id: 'anc',
    name: 'عيادات متابعة الحمل المتخصصة',
    icon: 'Stethoscope',
    tone: 'amber',
    role: 'مركز صحي متخصص يتابع فيه طبيب نساء وولادة الحمل ذا الخطورة المتوسطة.',
    usuallyFor: [
      'بعد الفحص الإيجابي: التحويل لعيادة متابعة الحمل، ويكون الموعد خلال 14 يومًا',
      'متابعة الحمل المصنّف «برتقالي» (خطورة متوسطة) وفق تقييم الطبيب'
    ]
  },
  {
    id: 'hospital',
    name: 'عيادات النساء والولادة بالمستشفى',
    icon: 'Hospital',
    tone: 'brand',
    role: 'متابعة متخصصة مع طبيب النساء والولادة في المستشفى.',
    usuallyFor: [
      'متابعة الحمل المصنّف «أحمر» (خطورة عالية)',
      'تقييم لمرة واحدة عند وجود 3 عوامل متوسطة أو أكثر لتحديد مكان المتابعة',
      'من 35 أسبوعًا: متابعة أسبوعية في المستشفى'
    ]
  },
  {
    id: 'er',
    name: 'قسم الطوارئ',
    icon: 'Siren',
    tone: 'urgent',
    role: 'للحالات العاجلة وعلامات الخطر، في أي وقت ومهما كان تصنيف حملك.',
    usuallyFor: [
      'عند ظهور أيٍّ من علامات الخطر (مثل النزيف، أو قلة حركة الجنين، أو نزول الماء)',
      'لا تؤجّلي الذهاب إذا ظهرت علامة خطر، حتى لو كان حملك منخفض الخطورة'
    ]
  }
];

export const sehhaty = {
  name: 'تطبيق «صحتي»',
  description: 'تطبيق وزارة الصحة لحجز المواعيد في مراكز الرعاية الصحية الأولية. يمكنكِ تحميله من متجر التطبيقات الرسمي في جهازك والبحث عن «صحتي».',
  uses: ['حجز موعد في عيادة طب الأسرة عند الشك بالحمل']
};

/** Hospital-specific official channels — leave empty until verified by the hospital. */
export const officialChannels: { label: string; value: string; href?: string }[] = [];
