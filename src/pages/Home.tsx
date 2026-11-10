import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Siren } from 'lucide-react';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { dangerSigns } from '../content/symptoms';

const cards = [
  { to: '/journey', icon: 'Route', title: 'تعرّفي على رحلة حملك', desc: 'المواعيد والفحوصات من بداية الحمل حتى الولادة، حسب أسبوع حملك.', tone: 'brand' },
  { to: '/risk', icon: 'ClipboardList', title: 'افهمي عوامل خطورة حملك', desc: 'أسئلة بسيطة توضّح عوامل الخطورة والمسار المعتاد للمتابعة.', tone: 'brand' },
  { to: '/symptoms', icon: 'TriangleAlert', title: 'هل لديكِ أعراض تستدعي المساعدة؟', desc: 'تعرّفي على الأعراض التي تحتاج اهتمامًا طبيًا عاجلًا.', tone: 'urgent' },
  { to: '/emergency', icon: 'Siren', title: 'متى أراجع الطوارئ؟', desc: 'علامات الخطر الثمانية وأرقام التواصل في الحالات الطارئة.', tone: 'urgent' },
  { to: '/where', icon: 'MapPin', title: 'أين أتابع حملي؟', desc: 'الفرق بين المركز الصحي والعيادات المتخصصة والمستشفى والطوارئ.', tone: 'calm' },
  { to: '/tips', icon: 'Leaf', title: 'نصائح لحمل صحي وآمن', desc: 'نصائح يومية بسيطة لكِ ولطفلك.', tone: 'calm' }
] as const;

const toneCls = {
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
  calm: 'bg-calm-50 text-calm-700 dark:bg-calm-900/40 dark:text-calm-300',
  urgent: 'bg-urgent-50 text-urgent-600 dark:bg-urgent-900/40 dark:text-urgent-100'
};

const welcome = 'مرحبًا بكِ في رحلة الحمل الآمن';
const welcomeLead = 'استثمري وقت انتظارك في التعرف على صحة حملك، وفهم علامات الخطورة، ومعرفة متى تحتاجين إلى الرعاية الطبية.';

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-brand-600 to-brand-800 px-6 py-8 text-white sm:px-10 sm:py-12 dark:from-brand-800 dark:to-brand-950">
        <svg className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 opacity-15" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="90" fill="none" stroke="white" strokeWidth="14" />
          <circle cx="100" cy="100" r="50" fill="none" stroke="white" strokeWidth="10" />
        </svg>
        <div className="relative max-w-2xl">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{welcome}</h1>
          <p className="mt-3 text-lg leading-relaxed text-brand-50 sm:text-xl">{welcomeLead}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/learn" className="btn bg-white text-brand-800 hover:bg-brand-50">
              <Clock className="h-5 w-5" aria-hidden="true" /> تعلّمي خلال انتظارك · 3–5 دقائق
            </Link>
            <SpeakButton text={`${welcome}. ${welcomeLead}`} className="border-white/30 bg-white/10 text-white hover:bg-white/20 dark:border-white/30 dark:bg-white/10 dark:text-white" />
          </div>
        </div>
      </section>

      <section aria-labelledby="sections-title">
        <h2 id="sections-title" className="sr-only">أقسام المنصة</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(c => (
            <li key={c.to}>
              <Link to={c.to} className="card group flex h-full items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700">
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${toneCls[c.tone]}`}>
                  <Icon name={c.icon} className="h-7 w-7" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-extrabold text-slate-900 dark:text-white">{c.title}</span>
                  <span className="mt-1 block text-[15px] leading-relaxed muted">{c.desc}</span>
                </span>
                <ArrowLeft className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-hover:-translate-x-1 group-hover:text-brand-600" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border-2 border-urgent-500 bg-urgent-50 p-5 sm:p-6 dark:border-urgent-600 dark:bg-urgent-900/30" aria-labelledby="danger-title">
        <div className="mb-3 flex items-center gap-2">
          <Siren className="h-7 w-7 text-urgent-600 dark:text-urgent-100" aria-hidden="true" />
          <h2 id="danger-title" className="text-xl font-extrabold text-urgent-700 dark:text-urgent-100">علامات الخطر · لا تنتظري</h2>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {dangerSigns.map(s => (
            <li key={s.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-semibold dark:bg-slate-900">
              <Icon name={s.icon} className="h-5 w-5 shrink-0 text-urgent-600 dark:text-urgent-100" /> {s.source}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[15px] font-semibold text-urgent-900 dark:text-urgent-100">
          إذا كان لديكِ أيٌّ منها الآن وأنتِ في المستشفى، أبلغي طاقم التمريض أو الفرز فورًا.
        </p>
      </section>
    </div>
  );
}
