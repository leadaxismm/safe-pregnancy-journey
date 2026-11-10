import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Minus, Plus, Route, Siren, Star } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { SpeakButton } from '../components/SpeakButton';
import { Icon } from '../components/Icon';
import { journey, stepsForWeek, tagLabel, highRiskNote, type JourneyStep, type JourneyTag } from '../content/journey';

const tagIcon: Record<JourneyTag, string> = {
  appointment: 'CalendarCheck', tests: 'FlaskConical', scan: 'ScanLine', vaccine: 'Syringe', birth: 'Baby', watch: 'Eye', supplement: 'Pill', risk: 'ShieldAlert'
};

function stepSpeech(s: JourneyStep) {
  return `${s.when}. ${s.title}. ${s.items.map(i => i.text).join('. ')}`;
}

function StepItems({ step }: { step: JourneyStep }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {step.items.map(i => (
        <li key={i.text} className="flex gap-2">
          <Icon name={tagIcon[i.tag]} className="mt-1 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-300" />
          <span><span className="sr-only">{tagLabel[i.tag]}: </span>{i.text}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Journey() {
  const [week, setWeek] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [filter, setFilter] = useState<JourneyTag | null>(null);
  const { current, next } = useMemo(() => (week ? stepsForWeek(week) : { current: [], next: undefined }), [week]);
  const currentNs = new Set(current.map(s => s.n));
  const shown = filter ? journey.filter(s => s.items.some(i => i.tag === filter)) : journey;
  const tags = Object.keys(tagLabel) as JourneyTag[];

  return (
    <div>
      <PageHeader
        title="رحلة متابعة حملك"
        lead="اختاري أسبوع حملك لتعرفي ما المتوقع في هذه المرحلة وما القادم."
        icon={<Route className="h-6 w-6" />}
      />

      <section className="card p-5 sm:p-6" aria-labelledby="week-title">
        <h2 id="week-title" className="text-lg font-extrabold">في أي أسبوع من الحمل أنتِ؟</h2>
        <div className="mt-4 flex items-center gap-3">
          <button className="btn-secondary h-14 w-14 shrink-0 p-0" onClick={() => setWeek(w => Math.max(1, (w ?? 13) - 1))} aria-label="أسبوع أقل"><Minus className="h-6 w-6" /></button>
          <div className="flex-1 text-center">
            <div className="text-4xl font-extrabold tabular text-brand-700 dark:text-brand-300" aria-live="polite">{week ?? '—'}</div>
            <div className="text-sm muted">{week ? 'أسبوعًا' : 'لم تختاري بعد'}</div>
          </div>
          <button className="btn-secondary h-14 w-14 shrink-0 p-0" onClick={() => setWeek(w => Math.min(42, (w ?? 11) + 1))} aria-label="أسبوع أكثر"><Plus className="h-6 w-6" /></button>
        </div>
        <label htmlFor="week-range" className="sr-only">أسبوع الحمل</label>
        <input
          id="week-range" type="range" min={1} max={42} value={week ?? 12}
          onChange={e => setWeek(Number(e.target.value))}
          className="mt-4 w-full accent-brand-600" dir="rtl"
        />
        <div className="mt-1 flex justify-between text-xs muted tabular"><span>1</span><span>12</span><span>24</span><span>34</span><span>42</span></div>
        {week === null && <p className="mt-3 text-sm muted">لا تعرفين أسبوع حملك؟ لا بأس، تصفّحي الرحلة كاملة في الأسفل أو اسألي الفريق الصحي.</p>}
      </section>

      {week !== null && (
        <section className="mt-5 grid gap-4 md:grid-cols-2 fade-in" aria-live="polite">
          <div className="card border-brand-300 p-5 dark:border-brand-700">
            <div className="eyebrow">الأسبوع {week} · هذه المرحلة</div>
            {current.length ? current.map(s => (
              <div key={s.n} className="mt-3">
                <div className="chip bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200">{s.when}</div>
                <h3 className="mt-2 text-lg font-extrabold">{s.title}</h3>
                <StepItems step={s} />
                <SpeakButton text={stepSpeech(s)} className="mt-3" />
              </div>
            )) : (
              <p className="mt-3">لا توجد فحوصات محددة في هذا الأسبوع ضمن الرحلة المعتادة. استمري في الالتزام بمواعيدك.</p>
            )}
          </div>
          <div className="card p-5">
            <div className="eyebrow">ما القادم؟</div>
            {next ? (
              <div className="mt-3">
                <div className="chip bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{next.when}</div>
                <h3 className="mt-2 text-lg font-extrabold">{next.title}</h3>
                <StepItems step={next} />
              </div>
            ) : <p className="mt-3">أنتِ في المرحلة الأخيرة من الرحلة.</p>}
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-urgent-200 bg-urgent-50 p-4 md:col-span-2 dark:border-urgent-900 dark:bg-urgent-900/30">
            <Siren className="mt-0.5 h-6 w-6 shrink-0 text-urgent-600 dark:text-urgent-100" aria-hidden="true" />
            <p className="font-semibold">في كل مراحل الحمل: انتبهي لعلامات الخطر. <Link to="/emergency" className="underline underline-offset-4">تعرّفي عليها هنا</Link>.</p>
          </div>
        </section>
      )}

      <section className="mt-8" aria-labelledby="tl-title">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="tl-title" className="text-xl font-extrabold">الرحلة كاملة</h2>
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="تصفية حسب النوع">
          <button onClick={() => setFilter(null)} aria-pressed={filter === null} className={`chip min-h-[40px] shrink-0 border ${filter === null ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>الكل</button>
          {tags.map(t => (
            <button key={t} onClick={() => setFilter(t)} aria-pressed={filter === t} className={`chip min-h-[40px] shrink-0 border ${filter === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
              <Icon name={tagIcon[t]} className="h-4 w-4" />{tagLabel[t]}
            </button>
          ))}
        </div>

        <ol className="relative space-y-3 before:absolute before:bottom-6 before:right-[23px] before:top-6 before:w-[3px] before:rounded before:bg-slate-200 dark:before:bg-slate-800">
          {shown.map(s => {
            const isCur = currentNs.has(s.n);
            const isOpen = open === s.n || isCur;
            return (
              <li key={s.n} className="relative grid grid-cols-[48px_1fr] gap-3">
                <div className={`z-10 grid h-12 w-12 place-items-center rounded-full text-lg font-extrabold tabular ring-4 ring-slate-50 dark:ring-slate-950 ${isCur ? 'bg-calm-600 text-white' : s.key ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100'}`}>
                  {s.n}
                </div>
                <div className={`card overflow-hidden ${isCur ? 'border-calm-500 ring-2 ring-calm-500/30' : ''}`}>
                  <button
                    className="flex w-full items-center gap-3 p-4 text-start"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(o => (o === s.n ? null : s.n))}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip bg-brand-50 py-0.5 text-brand-800 dark:bg-brand-950 dark:text-brand-200">{s.when}</span>
                        {s.key && <span className="chip py-0.5 text-brand-700 dark:text-brand-300"><Star className="h-4 w-4" aria-hidden="true" />محطة مهمة</span>}
                        {isCur && <span className="chip bg-calm-50 py-0.5 text-calm-700 dark:bg-calm-900/40 dark:text-calm-300">أنتِ هنا</span>}
                      </div>
                      <h3 className="mt-1.5 text-[17px] font-extrabold">{s.title}</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-4 pb-4 dark:border-slate-800">
                      <StepItems step={s} />
                      <SpeakButton text={stepSpeech(s)} className="mt-3" />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-5 rounded-2xl bg-brand-50 p-4 font-semibold dark:bg-brand-950">{highRiskNote}</p>
      </section>
    </div>
  );
}
