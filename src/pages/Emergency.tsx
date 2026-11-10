import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Hospital, Phone, Siren, BookHeart, MapPin } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { useHelp } from '../components/HelpContext';
import { dangerSigns } from '../content/symptoms';
import { contacts, urgentMessage } from '../content/contacts';
import { track } from '../lib/analytics';

/**
 * «علامات الخطر ومتى أراجع الطوارئ؟» — the former "symptoms" and "when to go to the ER" pages merged.
 * The 8 danger signs appear ONCE, as tappable items. Safety design:
 *  - Tapping ANY sign immediately shows the urgent message + help button.
 *  - There is deliberately NO "you are fine" state; selecting nothing never produces a reassuring message.
 *  - Nothing is computed, stored or sent; this page never concludes that a case is non-urgent.
 */
export default function Emergency() {
  const { openHelp } = useHelp();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const alertRef = useRef<HTMLDivElement>(null);
  const any = picked.size > 0;
  useEffect(() => { track('symptom_checker_opened'); }, []);
  useEffect(() => { if (any) alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [any]);
  const toggle = (id: string) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const speech = 'علامات الخطر. اذهبي للطوارئ فورًا عند: ' + dangerSigns.map(s => s.source).join('، ') + '. إذا كنتِ في المستشفى أبلغي طاقم التمريض أو الفرز فورًا. وفي حالة الطوارئ اتصلي بالإسعاف 997.';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="علامات الخطر ومتى أراجع الطوارئ؟"
        lead="اذهبي للطوارئ فورًا عند ظهور أيٍّ من هذه العلامات. اضغطي على العلامة التي تشعرين بها الآن لتعرفي ما تفعلين."
        icon={<Siren className="h-6 w-6" />}
        speakText={speech}
      />

      <div ref={alertRef} className="scroll-mt-24" aria-live="assertive" role={any ? 'alert' : undefined}>
        {any && (
          <div className="rounded-3xl bg-urgent-600 p-4 text-white shadow-lg sm:p-5 fade-in" data-testid="urgent-alert">
            <div className="flex items-start gap-3">
              <Siren className="mt-1 h-7 w-7 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-lg font-extrabold sm:text-xl">قد تحتاجين إلى تقييم طبي عاجل</p>
                <p className="mt-1.5 text-[16px] font-semibold leading-relaxed">{urgentMessage}</p>
              </div>
            </div>
            <button onClick={openHelp} className="btn mt-3 w-full bg-white text-lg text-urgent-700 hover:bg-urgent-50">أحتاج إلى مساعدة طبية الآن</button>
          </div>
        )}
      </div>

      <section aria-labelledby="signs">
        <h2 id="signs" className="mb-2 text-lg font-extrabold">علامات الخطر الثمانية</h2>
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" data-testid="danger-signs">
          {dangerSigns.map(s => {
            const on = picked.has(s.id);
            return (
              <li key={s.id}>
                <button onClick={() => toggle(s.id)} aria-pressed={on}
                  className={`flex min-h-[64px] w-full items-center gap-3 rounded-2xl border-2 p-3 text-start text-[16px] font-bold transition ${on ? 'border-urgent-600 bg-urgent-50 text-urgent-900 dark:bg-urgent-900/40 dark:text-urgent-50' : 'border-slate-200 bg-white hover:border-urgent-300 dark:border-slate-800 dark:bg-slate-900'}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? 'bg-urgent-600 text-white' : 'bg-urgent-50 text-urgent-600 dark:bg-urgent-900/40 dark:text-urgent-100'}`}>
                    {on ? <Check className="h-5 w-5" aria-hidden="true" /> : <Icon name={s.icon} className="h-5 w-5" />}
                  </span>
                  {s.source}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-sm muted">القائمة لا تشمل كل الأعراض. إذا كان لديكِ أي عرض آخر يقلقك، أخبري الفريق الصحي ولا تعتمدي على هذه الصفحة.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="ماذا أفعل؟">
        <div className="card p-4">
          <h2 className="flex items-center gap-2 text-[17px] font-extrabold"><Hospital className="h-5 w-5 text-brand-600" aria-hidden="true" />داخل المستشفى أو صالة الانتظار</h2>
          <p className="mt-1.5 text-[16px]">أبلغي طاقم التمريض أو الفرز فورًا. لا تنتظري دورك ولا تُكملي أي استبيان.</p>
        </div>
        <div className="card border-urgent-200 p-4 dark:border-urgent-900">
          <h2 className="flex items-center gap-2 text-[17px] font-extrabold"><Phone className="h-5 w-5 text-urgent-600" aria-hidden="true" />خارج المستشفى: اتصلي فورًا</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {contacts.map(c => (
              <a key={c.number} href={`tel:${c.number}`} className={`flex flex-col items-center rounded-xl p-2 ${c.primary ? 'bg-urgent-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <span className="text-2xl font-extrabold tabular tracking-wider">{c.number}</span>
                <span className="text-sm font-bold">{c.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <div>
          <h2 className="text-[17px] font-extrabold">علامات الخطر أولًا، مهما كان تصنيف حملك</h2>
          <p className="mt-1 text-[16px]">تصنيف حملك (أخضر أو برتقالي أو أحمر) يحدد خطة المتابعة المعتادة، ولا يقيّم أعراضك الحالية. علامة الخطر تحتاج تقييمًا عاجلًا حتى لو كان حملك منخفض الخطورة.</p>
        </div>
        <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
          <h2 className="text-[17px] font-extrabold">للمتابعة الروتينية</h2>
          <p className="mt-1 text-[16px]">الفحوصات والمواعيد المعتادة تكون في مكان متابعتك (المركز الصحي أو العيادة المتخصصة أو عيادة المستشفى) حسب تصنيف حملك.</p>
          <p className="mt-1.5 flex items-center gap-2 font-semibold"><BookHeart className="h-5 w-5 text-calm-600" aria-hidden="true" />أحضري «جواز صحة الأم» معكِ دائمًا.</p>
          <Link to="/where" className="btn-secondary mt-3 min-h-[44px]"><MapPin className="h-5 w-5" aria-hidden="true" />أين أتابع حملي؟</Link>
        </div>
      </section>
    </div>
  );
}
