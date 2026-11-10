import { Info, Lock, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { contentMeta, statusLabel } from '../content/meta';
import { disclaimer } from '../content/contacts';

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="عن المنصة" lead="رحلة الحمل الآمن | Safe Pregnancy Journey" icon={<Info className="h-6 w-6" />} />
      <section className="card p-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><ShieldCheck className="h-6 w-6 text-brand-600" aria-hidden="true" />تنبيه طبي</h2>
        <p className="mt-2">{disclaimer}</p>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-[15px]">
          <li>لا تقدّم المنصة تشخيصًا فرديًا، ولا تقترح أدوية أو جرعات.</li>
          <li>الاستبيان ليس بديلًا عن الفرز السريري، ولا يحدد مكان رعايتك بشكل نهائي.</li>
          <li>علامات الخطر تتقدّم دائمًا على أي نتيجة في المنصة.</li>
        </ul>
      </section>
      <section className="card p-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><Lock className="h-6 w-6 text-calm-600" aria-hidden="true" />خصوصيتك</h2>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-[15px]">
          <li>لا تحتاجين إلى تسجيل دخول، ولا نطلب اسمك أو رقم هويتك أو ملفك الطبي.</li>
          <li>إجاباتك في الاستبيانات تبقى على جهازك فقط، ولا تُحفظ ولا تُرسل، وتُمسح عند إغلاق الصفحة.</li>
          <li>نجمع إحصائيات مجمّعة ومجهولة فقط (مثل عدد الزيارات وإكمال المحتوى ودرجات الاختبار القصير) لتحسين الخدمة.</li>
        </ul>
      </section>
      <section className="card p-5 text-[15px]">
        <h2 className="text-lg font-extrabold">حوكمة المحتوى</h2>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="font-bold">الجهة</dt><dd>{contentMeta.organization} – {contentMeta.facility}</dd>
          <dt className="font-bold">المصدر</dt><dd>{contentMeta.sourceTitle}</dd>
          <dt className="font-bold">إعداد المحتوى الأصلي</dt><dd>{contentMeta.sourcePageAuthor}</dd>
          <dt className="font-bold">إصدار المحتوى</dt><dd className="tabular"><bdi dir="ltr">{contentMeta.version}</bdi></dd>
          <dt className="font-bold">الحالة</dt><dd>{statusLabel[contentMeta.status]}</dd>
          <dt className="font-bold">آخر مراجعة طبية</dt><dd className="tabular">{contentMeta.lastClinicalReview ?? 'لم تتم بعد'}</dd>
          {contentMeta.approvedBy && (<><dt className="font-bold">اعتمده</dt><dd>{contentMeta.approvedBy}</dd></>)}
        </dl>
        <h3 className="mt-4 font-extrabold">سجل الإصدارات والمراجعات</h3>
        <ol className="mt-2 space-y-2">
          {contentMeta.changelog.map((c, i) => (
            <li key={i} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <div className="text-sm font-bold"><bdi dir="ltr" className="tabular">{c.version}</bdi> · <span className="tabular">{c.date}</span></div>
              <p className="text-sm muted">{c.note}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
