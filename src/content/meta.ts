/**
 * Content governance metadata.
 * Every medical statement in /src/content comes from the source page
 * "رحلة متابعة الحمل" (HHC Antenatal Patient Page), which cites
 * الدليل الإكلينيكي لرعاية الحامل في الرعاية الأولية — الشركة القابضة الصحية (MC0526_08).
 *
 * Nothing here is clinically approved yet. Change `status` to 'approved' and fill
 * `lastClinicalReview` + `approvedBy` ONLY after sign-off by the clinical team
 * (see docs/CLINICAL_REVIEW.md). While status is 'draft' the site shows a review banner.
 */
export type ContentStatus = 'draft' | 'in_review' | 'approved';

export const contentMeta = {
  version: '0.1.0-draft',
  status: 'draft' as ContentStatus,
  /** ISO date of the last clinical review, or null if never reviewed */
  lastClinicalReview: null as string | null,
  approvedBy: null as string | null,
  sourceTitle: 'الدليل الإكلينيكي لرعاية الحامل في الرعاية الأولية — الشركة القابضة الصحية (MC0526_08)',
  sourcePageAuthor: 'د. بدر السهلي',
  organization: 'تجمع حفر الباطن الصحي',
  facility: 'مستشفى الولادة والأطفال',
  changelog: [
    {
      version: '0.1.0-draft',
      date: '2026-11-10',
      note: 'تحويل صفحة «رحلة متابعة الحمل» إلى منصة تفاعلية. المحتوى الطبي منقول من الصفحة الأصلية دون تعديل، وبانتظار المراجعة والاعتماد.'
    }
  ]
};

export const statusLabel: Record<ContentStatus, string> = {
  draft: 'نسخة مسودة — بانتظار المراجعة الطبية',
  in_review: 'قيد المراجعة الطبية',
  approved: 'محتوى معتمد طبيًا'
};
