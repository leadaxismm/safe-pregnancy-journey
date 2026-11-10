import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ClipboardList, Lock, Pencil, RotateCcw, Siren, CircleHelp } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { SpeakButton } from '../components/SpeakButton';
import { useHelp } from '../components/HelpContext';
import { riskSections, tierInfo } from '../content/riskFactors';
import { evaluate, inRange, validRanges, computeBmi, type Answer, type ResultTier } from '../lib/riskEngine';
import { track } from '../lib/analytics';

type Step = { kind: 'intro' } | { kind: 'age' } | { kind: 'body' } | { kind: 'section'; index: number } | { kind: 'result' };
const steps: Step[] = [
  { kind: 'intro' }, { kind: 'age' }, { kind: 'body' },
  ...riskSections.map((_, index) => ({ kind: 'section' as const, index })),
  { kind: 'result' }
];

const answerOpts: { v: Answer; label: string }[] = [
  { v: 'yes', label: 'نعم' },
  { v: 'no', label: 'لا' },
  { v: 'unsure', label: 'لا أعرف' }
];

const tierStyle: Record<ResultTier, { box: string; dot: string; text: string }> = {
  green: { box: 'border-calm-500 bg-calm-50 dark:bg-calm-900/30', dot: 'bg-calm-600', text: 'text-calm-700 dark:text-calm-300' },
  amber: { box: 'border-tier-amber bg-tier-amberSoft dark:border-tier-amberDark dark:bg-tier-amberSoftDark', dot: 'bg-tier-amber dark:bg-tier-amberDark', text: 'text-tier-amber dark:text-tier-amberDark' },
  hospitalReview: { box: 'border-urgent-500 bg-urgent-50 dark:bg-urgent-900/30', dot: 'bg-urgent-600', text: 'text-urgent-700 dark:text-urgent-100' },
  red: { box: 'border-urgent-500 bg-urgent-50 dark:bg-urgent-900/30', dot: 'bg-urgent-600', text: 'text-urgent-700 dark:text-urgent-100' }
};

function toNum(s: string): number | null {
  const n = parseFloat(s.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
  return Number.isFinite(n) ? n : null;
}

export default function RiskCheck() {
  const { openHelp } = useHelp();
  const [i, setI] = useState(0);
  const [age, setAge] = useState('');
  const [ht, setHt] = useState('');
  const [wt, setWt] = useState('');
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>({});
  const tracked = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const step = steps[i];
  const result = useMemo(
    () => evaluate({ age: toNum(age), heightCm: toNum(ht), weightKg: toNum(wt), answers }),
    [age, ht, wt, answers]
  );

  useEffect(() => { headingRef.current?.focus(); }, [i]);
  useEffect(() => {
    if (step.kind === 'result' && !tracked.current) {
      tracked.current = true;
      track('risk_check_completed', { value: result.complete ? 1 : 0 });
    }
  }, [step.kind, result.complete]);

  const go = (d: number) => setI(x => Math.min(steps.length - 1, Math.max(0, x + d)));
  const goTo = (k: Step['kind'], index?: number) => setI(steps.findIndex(s => s.kind === k && (index === undefined || (s as any).index === index)));
  const reset = () => { setAge(''); setHt(''); setWt(''); setAnswers({}); tracked.current = false; setI(0); };

  const progress = Math.round((i / (steps.length - 1)) * 100);
  const ageN = toNum(age), htN = toNum(ht), wtN = toNum(wt);
  const ageErr = age !== '' && !inRange(ageN, validRanges.age);
  const htErr = ht !== '' && !inRange(htN, validRanges.heightCm);
  const wtErr = wt !== '' && !inRange(wtN, validRanges.weightKg);
  const bmi = computeBmi(htN, wtN);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="افهمي عوامل خطورة حملك"
        lead="أسئلة بسيطة للتوعية فقط. طبيبك هو من يحدد التصنيف النهائي."
        icon={<ClipboardList className="h-6 w-6" />}
      />

      {step.kind !== 'intro' && step.kind !== 'result' && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm font-semibold muted"><span>الخطوة {i} من {steps.length - 2}</span><span className="tabular">{progress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="تقدّم الاستبيان">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="card p-5 sm:p-7">
        {step.kind === 'intro' && (
          <div className="space-y-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold">قبل أن تبدئي</h2>
            <ul className="space-y-3 text-[17px]">
              <li className="flex gap-3"><CircleHelp className="mt-1 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />أسئلة عن عمرك وطولك ووزنك وتاريخك الصحي وحملك الحالي. تحتاج 2–3 دقائق.</li>
              <li className="flex gap-3"><CircleHelp className="mt-1 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />إذا لم تعرفي الإجابة، اختاري «لا أعرف» واسألي الطبيب.</li>
              <li className="flex gap-3"><Lock className="mt-1 h-5 w-5 shrink-0 text-calm-600" aria-hidden="true" />إجاباتك لا تُحفَظ ولا تُرسَل إلى أي جهة، وتُمسَح عند إغلاق الصفحة.</li>
            </ul>
            <div className="flex items-start gap-3 rounded-2xl border-2 border-urgent-500 bg-urgent-50 p-4 dark:bg-urgent-900/30">
              <Siren className="mt-0.5 h-6 w-6 shrink-0 text-urgent-600 dark:text-urgent-100" aria-hidden="true" />
              <div>
                <p className="font-bold">هذا الاستبيان لا يقيّم أعراضك الحالية.</p>
                <p className="text-[15px]">إذا لديكِ الآن نزيف أو ألم شديد أو أي علامة خطر، لا تكملي — اطلبي المساعدة فورًا.</p>
                <button onClick={openHelp} className="btn-urgent mt-3 min-h-[44px] px-4 text-[15px]">أحتاج إلى مساعدة طبية الآن</button>
              </div>
            </div>
            <button onClick={() => go(1)} className="btn-primary w-full text-lg">ابدئي <ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
          </div>
        )}

        {step.kind === 'age' && (
          <div className="space-y-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold">كم عمرك؟</h2>
            <label className="block">
              <span className="mb-1 block font-semibold">العمر بالسنوات</span>
              <input className="field" type="text" inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} placeholder="مثال: 28" aria-invalid={ageErr} aria-describedby="age-err" />
            </label>
            {ageErr && <p id="age-err" className="font-semibold text-urgent-600 dark:text-urgent-100">أدخلي عمرًا بين 12 و60 سنة.</p>}
          </div>
        )}

        {step.kind === 'body' && (
          <div className="space-y-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold">ما طولك ووزنك؟</h2>
            <p className="muted">نستخدمهما لحساب مؤشر كتلة الجسم. الوزن قبل الحمل أو في بدايته إن كنتِ تعرفينه.</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-semibold">الطول (سم)</span>
                <input className="field" type="text" inputMode="numeric" value={ht} onChange={e => setHt(e.target.value)} placeholder="160" aria-invalid={htErr} />
              </label>
              <label className="block">
                <span className="mb-1 block font-semibold">الوزن (كجم)</span>
                <input className="field" type="text" inputMode="decimal" value={wt} onChange={e => setWt(e.target.value)} placeholder="65" aria-invalid={wtErr} />
              </label>
            </div>
            {htErr && <p className="font-semibold text-urgent-600 dark:text-urgent-100">أدخلي طولًا بين 120 و210 سم.</p>}
            {wtErr && <p className="font-semibold text-urgent-600 dark:text-urgent-100">أدخلي وزنًا بين 30 و250 كجم.</p>}
            {bmi !== null && <p className="rounded-xl bg-brand-50 p-3 font-semibold dark:bg-brand-950" aria-live="polite">مؤشر كتلة الجسم: <span className="tabular">{bmi}</span></p>}
          </div>
        )}

        {step.kind === 'section' && (() => {
          const sec = riskSections[step.index];
          const answered = sec.factors.filter(f => answers[f.id]).length;
          return (
            <div>
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold">{sec.title}</h2>
              <p className="mt-1 muted">{sec.hint}</p>
              <p className="mt-1 text-sm font-semibold muted tabular">أجبتِ عن {answered} من {sec.factors.length}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-ghost min-h-[40px] px-3 text-sm" onClick={() => setAnswers(a => ({ ...a, ...Object.fromEntries(sec.factors.filter(f => !a[f.id]).map(f => [f.id, 'no' as Answer])) }))}>
                  «لا» لكل ما لم أُجب عنه في هذه الصفحة
                </button>
              </div>
              <ul className="mt-3 space-y-3">
                {sec.factors.map(f => (
                  <li key={f.id}>
                    <fieldset className={`rounded-2xl border p-3 sm:p-4 ${answers[f.id] ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-300 dark:border-slate-700'}`}>
                      <legend className="sr-only">{f.text}</legend>
                      <p className="mb-2 text-[17px] font-semibold leading-relaxed" aria-hidden="true">{f.text}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {answerOpts.map(o => {
                          const on = answers[f.id] === o.v;
                          return (
                            <label key={o.v} className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border-2 text-base font-bold transition ${on ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-500 dark:text-slate-950' : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'}`}>
                              <input type="radio" className="sr-only" name={f.id} value={o.v} checked={on} onChange={() => setAnswers(a => ({ ...a, [f.id]: o.v }))} />
                              {o.label}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {step.kind === 'result' && <Result result={result} headingRef={headingRef} onEdit={goTo} onReset={reset} openHelp={openHelp} />}

        {step.kind !== 'intro' && step.kind !== 'result' && (
          <div className="mt-6 flex gap-3">
            <button onClick={() => go(-1)} className="btn-secondary flex-1"><ArrowRight className="h-5 w-5" aria-hidden="true" /> السابق</button>
            <button onClick={() => go(1)} className="btn-primary flex-[2]">
              {i === steps.length - 2 ? 'اعرضي النتيجة' : 'التالي'} <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Result({ result, headingRef, onEdit, onReset, openHelp }: {
  result: ReturnType<typeof evaluate>;
  headingRef: React.RefObject<HTMLHeadingElement>;
  onEdit: (k: Step['kind'], index?: number) => void;
  onReset: () => void;
  openHelp: () => void;
}) {
  const t = result.tier;
  const info = t ? tierInfo[t] : null;
  const speech = info
    ? `${info.title}. ${info.usual} هذه نتيجة تثقيفية وليست تشخيصًا. طبيبك هو من يحدد التصنيف النهائي.`
    : 'لا يمكن عرض تصنيف لأن بعض الإجابات غير مكتملة.';

  return (
    <div className="space-y-5" aria-live="polite">
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold">نتيجتك التثقيفية</h2>

      {info && t ? (
        <div className={`rounded-2xl border-2 p-5 ${tierStyle[t].box}`}>
          <div className="flex items-center gap-3">
            <span className={`h-5 w-5 shrink-0 rounded-full ${tierStyle[t].dot}`} aria-hidden="true" />
            <p className={`text-xl font-extrabold ${tierStyle[t].text}`}>{info.title}</p>
          </div>
          <p className="mt-2 text-[17px] font-semibold">{info.usual}</p>
          <p className="mt-1 text-sm muted">المسار المعتاد: {info.place}</p>
          {!result.complete && (
            <p className="mt-3 rounded-xl bg-white/70 p-3 text-[15px] font-semibold dark:bg-slate-900/60">
              بعض الإجابات غير مكتملة ({result.missing.join('، ')})، لذلك قد يكون التصنيف الفعلي أعلى.
            </p>
          )}
          <SpeakButton text={speech} className="mt-3" />
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xl font-extrabold">لا يمكن عرض تصنيف — الإجابات غير مكتملة</p>
          <p className="mt-2">لم تُكملي: {result.missing.join('، ')}.</p>
          <p className="mt-1 muted">أكملي الإجابات، أو اسألي طبيبك أو القابلة عن تصنيف حملك.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.missing.some(m => m === 'العمر') && <button className="btn-secondary min-h-[44px]" onClick={() => onEdit('age')}>أكملي العمر</button>}
            {result.missing.some(m => m.includes('الطول')) && <button className="btn-secondary min-h-[44px]" onClick={() => onEdit('body')}>أكملي الطول والوزن</button>}
            <button className="btn-secondary min-h-[44px]" onClick={() => onEdit('section', 0)}>راجعي الأسئلة</button>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-lg font-extrabold">عوامل الخطورة التي ذكرتِها</h3>
        {result.findings.length ? (
          <ul className="space-y-2">
            {result.findings.map(f => (
              <li key={f.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <span className={`chip shrink-0 py-0.5 text-white ${f.tier === 'red' ? 'bg-urgent-600' : 'bg-tier-amber'}`}>{f.tier === 'red' ? 'عالٍ' : 'متوسط'}</span>
                <span className="font-semibold">{f.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">لم تذكري أيًّا من عوامل الخطورة المدرجة في الاستبيان.</p>
        )}
      </div>

      <div className="rounded-2xl bg-brand-50 p-4 text-[15px] dark:bg-brand-950">
        <p className="font-bold">هذه نتيجة تثقيفية وليست تشخيصًا طبيًا أو قرارًا بمكان متابعتك.</p>
        <p>طبيبك هو من يحدد التصنيف النهائي، ويُعاد تقييم الخطورة في كل زيارة.</p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border-2 border-urgent-500 bg-urgent-50 p-4 dark:bg-urgent-900/30">
        <Siren className="mt-0.5 h-6 w-6 shrink-0 text-urgent-600 dark:text-urgent-100" aria-hidden="true" />
        <div>
          <p className="font-bold">هذا التصنيف لا يقيّم أعراضك الآن.</p>
          <p className="text-[15px]">أي علامة خطر تحتاج تقييمًا طبيًا عاجلًا مهما كان تصنيف حملك، حتى لو كان «أخضر».</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={openHelp} className="btn-urgent min-h-[44px] px-4 text-[15px]">أحتاج إلى مساعدة طبية الآن</button>
            <Link to="/symptoms" className="btn-secondary min-h-[44px] px-4 text-[15px]">تعرّفي على علامات الخطر</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={() => onEdit('section', 0)} className="btn-secondary"><Pencil className="h-5 w-5" aria-hidden="true" /> عدّلي إجاباتك</button>
        <button onClick={onReset} className="btn-secondary"><RotateCcw className="h-5 w-5" aria-hidden="true" /> امسحي وابدئي من جديد</button>
      </div>
      <Link to="/where" className="btn-ghost w-full">أين تكون المتابعة عادةً لكل تصنيف؟</Link>
    </div>
  );
}
