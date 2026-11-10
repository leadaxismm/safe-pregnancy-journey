import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Siren, TriangleAlert } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { useHelp } from '../components/HelpContext';
import { dangerSigns } from '../content/symptoms';
import { urgentMessage } from '../content/contacts';
import { track } from '../lib/analytics';

/**
 * Safety design (brief §5):
 *  - Selecting ANY sign immediately shows the urgent message + help button.
 *  - There is deliberately NO "you are fine" state: selecting nothing never produces a reassuring message.
 *  - Nothing is computed, stored or sent; this page never concludes a case is non-urgent.
 */
export default function Symptoms() {
  const { openHelp } = useHelp();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const alertRef = useRef<HTMLDivElement>(null);
  const any = picked.size > 0;

  useEffect(() => { track('symptom_checker_opened'); }, []);
  useEffect(() => {
    if (any) alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [any]);

  const toggle = (id: string) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="هل تشعرين بأعراض تحتاج إلى اهتمام طبي؟"
        lead="اضغطي على أي عرض تشعرين به الآن. هذه الصفحة للتوعية، ولا تحدد إن كانت حالتك طارئة أم لا."
        icon={<TriangleAlert className="h-6 w-6" />}
      />

      <div ref={alertRef} className="scroll-mt-24" aria-live="assertive" role={any ? 'alert' : undefined}>
        {any && (
          <div className="mb-5 rounded-3xl border-2 border-urgent-600 bg-urgent-600 p-5 text-white shadow-lg fade-in">
            <div className="flex items-start gap-3">
              <Siren className="mt-1 h-8 w-8 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xl font-extrabold">قد تحتاجين إلى تقييم طبي عاجل</p>
                <p className="mt-2 text-[17px] font-semibold leading-relaxed">{urgentMessage}</p>
              </div>
            </div>
            <button onClick={openHelp} className="btn mt-4 w-full bg-white text-lg text-urgent-700 hover:bg-urgent-50">
              أحتاج إلى مساعدة طبية الآن
            </button>
          </div>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {dangerSigns.map(s => {
          const on = picked.has(s.id);
          return (
            <li key={s.id}>
              <button
                onClick={() => toggle(s.id)}
                aria-pressed={on}
                className={`flex min-h-[72px] w-full items-center gap-3 rounded-2xl border-2 p-4 text-start text-[17px] font-bold transition ${on ? 'border-urgent-600 bg-urgent-50 text-urgent-900 dark:bg-urgent-900/40 dark:text-urgent-50' : 'border-slate-200 bg-white hover:border-urgent-300 dark:border-slate-800 dark:bg-slate-900'}`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${on ? 'bg-urgent-600 text-white' : 'bg-urgent-50 text-urgent-600 dark:bg-urgent-900/40 dark:text-urgent-100'}`}>
                  {on ? <Check className="h-6 w-6" aria-hidden="true" /> : <Icon name={s.icon} className="h-6 w-6" />}
                </span>
                {s.plain}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 space-y-3 rounded-2xl bg-slate-100 p-4 text-[15px] dark:bg-slate-900">
        <p className="font-semibold">هذه القائمة لا تشمل كل الأعراض. إذا كان لديكِ أي عرض آخر يقلقك، أخبري الفريق الصحي ولا تعتمدي على هذه الصفحة.</p>
        <p className="muted">الاستبيان ونتائج تصنيف الخطورة لا تغني عن الفرز الطبي.</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link to="/emergency" className="btn-secondary">متى أراجع الطوارئ؟</Link>
        <Link to="/where" className="btn-secondary">أين أتابع حملي؟</Link>
      </div>
    </div>
  );
}
