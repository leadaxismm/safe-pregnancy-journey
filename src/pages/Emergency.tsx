import { Link } from 'react-router-dom';
import { Hospital, Phone, Siren, BookHeart } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { useHelp } from '../components/HelpContext';
import { dangerSigns } from '../content/symptoms';
import { contacts } from '../content/contacts';

export default function Emergency() {
  const { openHelp } = useHelp();
  const speech = 'علامات الخطر. اذهبي للطوارئ فورًا عند: ' + dangerSigns.map(s => s.source).join('، ') + '. في حالة الطوارئ اتصلي بالإسعاف 997.';
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="متى أراجع الطوارئ؟"
        lead="علامات الخطر · اذهبي للطوارئ فورًا عند ظهور أيٍّ منها."
        icon={<Siren className="h-6 w-6" />}
        speakText={speech}
      />

      <section aria-labelledby="signs">
        <h2 id="signs" className="sr-only">علامات الخطر</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dangerSigns.map(s => (
            <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 border-r-4 border-r-urgent-600 bg-white p-4 text-[17px] font-bold dark:border-slate-800 dark:border-r-urgent-500 dark:bg-slate-900">
              <Icon name={s.icon} className="h-6 w-6 shrink-0 text-urgent-600 dark:text-urgent-100" /> {s.source}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border-2 border-urgent-600 bg-urgent-50 p-5 dark:bg-urgent-900/30" aria-labelledby="call">
        <h2 id="call" className="text-xl font-extrabold text-urgent-700 dark:text-urgent-100">في حالة الطوارئ اتصلي فورًا</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {contacts.map(c => (
            <a key={c.number} href={`tel:${c.number}`} className="flex flex-col items-center rounded-2xl bg-white p-4 hover:bg-urgent-50 dark:bg-slate-900">
              <span className="flex items-center gap-2 text-3xl font-extrabold tabular tracking-wider text-urgent-600 dark:text-urgent-100"><Phone className="h-6 w-6" aria-hidden="true" />{c.number}</span>
              <span className="font-bold muted">{c.label}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="card p-5" aria-labelledby="inside">
        <h2 id="inside" className="flex items-center gap-2 text-lg font-extrabold"><Hospital className="h-6 w-6 text-brand-600" aria-hidden="true" />إذا كنتِ الآن في صالة الانتظار</h2>
        <p className="mt-2 text-[17px]">أبلغي طاقم التمريض أو الفرز فورًا عند ظهور أي علامة خطر. لا تنتظري دورك ولا تُكملي أي استبيان.</p>
        <button onClick={openHelp} className="btn-urgent mt-4 w-full sm:w-auto">أحتاج إلى مساعدة طبية الآن</button>
      </section>

      <section className="card p-5" aria-labelledby="priority">
        <h2 id="priority" className="text-lg font-extrabold">علامات الخطر أولًا، مهما كان تصنيف حملك</h2>
        <p className="mt-2 text-[17px]">تصنيف حملك (أخضر أو برتقالي أو أحمر) يحدد خطة المتابعة المعتادة، ولا يقيّم أعراضك الحالية. علامة الخطر تحتاج تقييمًا عاجلًا حتى لو كان حملك منخفض الخطورة.</p>
      </section>

      <section className="card p-5" aria-labelledby="routine">
        <h2 id="routine" className="text-lg font-extrabold">للمتابعة الروتينية</h2>
        <p className="mt-2 text-[17px]">الفحوصات والمواعيد المعتادة تكون في مكان متابعتك (المركز الصحي أو العيادة المتخصصة أو عيادة المستشفى) حسب تصنيف حملك.</p>
        <p className="mt-2 flex items-center gap-2 font-semibold"><BookHeart className="h-5 w-5 text-calm-600" aria-hidden="true" />أحضري «جواز صحة الأم» معكِ دائمًا.</p>
        <Link to="/where" className="btn-secondary mt-4">أين أتابع حملي؟</Link>
      </section>
    </div>
  );
}
