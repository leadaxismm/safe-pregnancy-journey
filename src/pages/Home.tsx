import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';

/** Home sections, in the order requested. Numbering is derived from position, so it stays correct automatically. */
const cards = [
  { to: '/journey', icon: 'Route', title: 'رحلة متابعة الحمل', desc: 'المواعيد والفحوصات من بداية الحمل حتى الولادة، حسب أسبوع حملك.', tone: 'brand', wide: false },
  { to: '/risk', icon: 'ClipboardList', title: 'عوامل خطورة الحمل', desc: 'أسئلة بسيطة توضّح عوامل الخطورة والمسار المعتاد للمتابعة.', tone: 'brand', wide: false },
  { to: '/emergency', icon: 'Siren', title: 'علامات الخطر ومتى أراجع الطوارئ؟', desc: 'العلامات الثماني التي تستدعي المساعدة فورًا، وماذا تفعلين داخل المستشفى وخارجه.', tone: 'urgent', wide: true },
  { to: '/where', icon: 'MapPin', title: 'أين أتابع حملي؟', desc: 'الفرق بين المركز الصحي والعيادات المتخصصة والمستشفى والطوارئ.', tone: 'calm', wide: false },
  { to: '/learn', icon: 'GraduationCap', title: 'التثقيف أثناء الانتظار', desc: 'مسار قصير 3–5 دقائق مع اختبار قبل وبعد، ونصائح يومية.', tone: 'calm', wide: false }
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
    <div className="space-y-4 sm:space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-brand-600 via-brand-700 to-calm-700 px-4 py-4 text-white sm:px-10 sm:py-12 dark:from-brand-800 dark:via-brand-900 dark:to-calm-900">
        <svg className="pointer-events-none absolute -bottom-10 -left-10 hidden h-56 w-56 opacity-15 sm:block" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="90" fill="none" stroke="white" strokeWidth="14" />
          <circle cx="100" cy="100" r="50" fill="none" stroke="white" strokeWidth="10" />
        </svg>
        <div className="relative max-w-2xl">
          <h1 className="text-[21px] font-extrabold leading-tight sm:text-4xl">{welcome}</h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-brand-50 sm:mt-3 sm:text-xl">{welcomeLead}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
            <Link to="/learn" className="btn min-h-[44px] bg-white px-4 text-[15px] text-brand-800 hover:bg-brand-50 sm:min-h-[48px] sm:px-5 sm:text-base">
              <Clock className="h-5 w-5" aria-hidden="true" /> تعلّمي خلال انتظارك · 3–5 دقائق
            </Link>
            <SpeakButton text={`${welcome}. ${welcomeLead}`} className="border-white/30 bg-white/10 text-white hover:bg-white/20 dark:border-white/30 dark:bg-white/10 dark:text-white" />
          </div>
        </div>
      </section>

      <section aria-labelledby="sections-title">
        <h2 id="sections-title" className="sr-only">أقسام المنصة</h2>
        <ul className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:gap-4" data-testid="home-cards">
          {cards.map((c, i) => (
            <li key={c.to} className={c.wide ? 'col-span-2' : ''}>
              {c.wide ? (
                <Link to={c.to} className="group flex h-full items-center gap-3 rounded-2xl border-2 border-urgent-500 bg-urgent-50 p-3.5 transition hover:shadow-md sm:p-5 dark:border-urgent-600 dark:bg-urgent-900/30">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-urgent-600 text-white sm:h-14 sm:w-14"><Icon name={c.icon} className="h-6 w-6 sm:h-7 sm:w-7" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-0.5 hidden text-xs font-bold text-urgent-700/70 tabular sm:block dark:text-urgent-100/70">{i + 1}</span>
                    <span className="block text-[17px] font-extrabold leading-snug text-urgent-700 sm:text-xl dark:text-urgent-50"><span className="tabular opacity-60 sm:hidden">{i + 1}. </span>{c.title}</span>
                    <span className="mt-1 block text-[14px] leading-relaxed sm:text-[15px] text-urgent-900 dark:text-urgent-100">{c.desc}</span>
                    <span className="mt-1.5 block text-[14px] font-bold text-urgent-700 dark:text-urgent-100">إذا كان لديكِ أيٌّ منها الآن وأنتِ في المستشفى، أبلغي طاقم التمريض أو الفرز فورًا.</span>
                  </span>
                  <ArrowLeft className="h-6 w-6 shrink-0 text-urgent-600 transition group-hover:-translate-x-1 dark:text-urgent-100" aria-hidden="true" />
                </Link>
              ) : (
                <Link to={c.to} className="card group flex h-full min-h-[96px] flex-col justify-center gap-2 p-3.5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:flex-row sm:items-start sm:gap-4 sm:p-5 dark:hover:border-brand-700">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-14 sm:w-14 sm:rounded-2xl ${toneCls[c.tone]}`}>
                    <Icon name={c.icon} className="h-5 w-5 sm:h-7 sm:w-7" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-0.5 hidden text-xs font-bold text-slate-400 tabular sm:block">{i + 1}</span>
                    <span className="block text-[16px] font-extrabold leading-snug text-slate-900 sm:text-lg dark:text-white"><span className="tabular text-slate-400 sm:hidden">{i + 1}. </span>{c.title}</span>
                    <span className="mt-1 hidden text-[15px] leading-relaxed muted sm:block">{c.desc}</span>
                  </span>
                  <ArrowLeft className="mt-1 hidden h-5 w-5 shrink-0 text-slate-400 transition group-hover:-translate-x-1 group-hover:text-brand-600 sm:block" aria-hidden="true" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
