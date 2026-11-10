/** QR placement locations (brief §10). Used as an anonymous `src` tag so the admin can see which posters are used. */
export const qrLocations = [
  { id: 'obgyn-waiting', label: 'صالات انتظار النساء والولادة' },
  { id: 'er-waiting', label: 'مناطق انتظار الطوارئ' },
  { id: 'outpatient', label: 'العيادات الخارجية' },
  { id: 'phc', label: 'مراكز الرعاية الصحية الأولية' },
  { id: 'screens', label: 'الشاشات التثقيفية داخل المستشفى' }
] as const;

export const topicLabels: Record<string, string> = {
  home: 'الصفحة الرئيسية',
  journey: 'رحلة متابعة الحمل',
  risk: 'عوامل خطورة الحمل',
  symptoms: 'الأعراض (صفحة سابقة)',
  emergency: 'علامات الخطر ومتى أراجع الطوارئ',
  where: 'أين أتابع حملي؟',
  tips: 'نصائح لحمل صحي',
  learn: 'التعلّم خلال الانتظار',
  about: 'عن المنصة',
  direct: 'بدون رمز QR',
  ...Object.fromEntries(qrLocations.map(l => [l.id, l.label]))
};
