import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ClipboardList, Lock, Pencil, RotateCcw, Siren, CircleHelp, Home, ListChecks, CircleCheck, CircleDashed } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { SpeakButton } from '../components/SpeakButton';
import { useHelp } from '../components/HelpContext';
import { riskSections, allFactors, tierInfo } from '../content/riskFactors';
import { evaluate, inRange, validRanges, computeBmi, displayBmi, parseNumber, validAge, type Answer, type ResultTier, type RiskResult } from '../lib/riskEngine';
import { track } from '../lib/analytics';

type Step = { kind: 'intro' } | { kind: 'age' } | { kind: 'body' } | { kind: 'section'; index: number } | { kind: 'review' } | { kind: 'result' };
const steps: Step[] = [
  { kind: 'intro' }, { kind: 'age' }, { kind: 'body' },
  ...riskSections.map((_, index) => ({ kind: 'section' as const, index })),
  { kind: 'result' }
];
const RESULT = steps.length - 1;
const LAST_QUESTION = steps.length - 2;

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

const sectionOf = (id: string) => riskSections.find(s => s.factors.some(f => f.id === id))!;

/** Answers live only in this component's memory (never stored or sent). They survive every Back/Next/Review move. */
export default function RiskCheck() {
  const { openHelp } = useHelp();
  const [i, setI] = useState(0);
  const [age, setAge] = useState('');
  const [ht, setHt] = useState('');
  const [wt, setWt] = useState('');
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>({});
  /** snapshot of what to review, taken when the review screen opens (so items don't vanish while answering) */
  const [review, setReview] = useState<{ ids: string[]; age: boolean; body: boolean } | null>(null);
  const tracked = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const step: Step = review ? { kind: 'review' } : steps[i];
  const result = useMemo(
    () => evaluate({ age: parseNumber(age), heightCm: parseNumber(ht), weightKg: parseNumber(wt), answers }),
    [age, ht, wt, answers]
  );

  useEffect(() => { headingRef.current?.focus(); window.scrollTo({ top: 0 }); }, [i, review]);
  useEffect(() => {
    if (step.kind === 'result' && !tracked.current) {
      tracked.current = true;
      track('risk_check_completed', { value: result.complete ? 1 : 0 });
    }
  }, [step.kind, result.complete]);

  const go = (d: number) => setI(x => Math.min(RESULT, Math.max(0, x + d)));
  const goTo = (k: Step['kind'], index?: number) => { setReview(null); setI(steps.findIndex(s => s.kind === k && (index === undefined || (s as { index?: number }).index === index))); };
  const openReview = () => setReview({ ids: [...result.unsureIds, ...result.unansweredIds].sort((a, b) => order(a) - order(b)), age: result.missingAge, body: result.missingBody });
  const closeReview = () => { setReview(null); setI(RESULT); };
  const reset = () => { setAge(''); setHt(''); setWt(''); setAnswers({}); setReview(null); tracked.current = false; setI(0); };
  const setAnswer = (id: string, v: Answer) => setAnswers(a => ({ ...a, [id]: v }));

  const progress = Math.round((i / RESULT) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="افهمي عوامل خطورة حملك"
        lead="أسئلة بسيطة للتوعية فقط. طبيبك هو من يحدد التصنيف النهائي."
        icon={<ClipboardList className="h-6 w-6" />}
      />

      {step.kind !== 'intro' && step.kind !== 'result' && step.kind !== 'review' && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm font-semibold muted"><span>الخطوة {i} من {LAST_QUESTION}</span><span className="tabular">{progress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="تقدّم الاستبيان">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="card p-4 sm:p-7">
        {step.kind === 'intro' && (
          <div className="space-y-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold">قبل أن تبدئي</h2>
            <ul className="space-y-3 text-[17px]">
              <li className="flex gap-3"><CircleHelp className="mt-1 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />أسئلة عن عمرك وطولك ووزنك وتاريخك الصحي وحملك الحالي. تحتاج 2–3 دقائق.</li>
              <li className="flex gap-3"><CircleHelp className="mt-1 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />إذا لم تعرفي الإجابة، اختاري «لا أعرف» واسألي الطبيب.</li>
              <li className="flex gap-3"><Lock className="mt-1 h-5 w-5 shrink-0 text-calm-600" aria-hidden="true" />إجاباتك لا تُحفَظ ولا تُرسَل إلى أي جهة، وتُمسَح عند إغلاق الصفحة.</li>
            </ul>
            <UrgentNote openHelp={openHelp} title="هذا الاستبيان لا يقيّم أعراضك الحالية." text="إذا لديكِ الآن نزيف أو ألم شديد أو أي علامة خطر، لا تكملي — اطلبي المساعدة فورًا." />
            <button onClick={() => go(1)} className="btn-primary w-full text-lg">ابدئي <ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
          </div>
        )}

        {step.kind === 'age' && (
          <div className="space-y-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold">كم عمرك؟</h2>
            <AgeInput value={age} onChange={setAge} />
          </div>
        )}

        {step.kind === 'body' && (
          <div className="space-y-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold">ما طولك ووزنك؟</h2>
            <p className="muted">نستخدمهما لحساب مؤشر كتلة الجسم. الوزن قبل الحمل أو في بدايته إن كنتِ تعرفينه.</p>
            <BodyInputs ht={ht} wt={wt} setHt={setHt} setWt={setWt} />
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
              <button className="btn-ghost mt-2 min-h-[40px] px-3 text-sm" onClick={() => setAnswers(a => ({ ...a, ...Object.fromEntries(sec.factors.filter(f => !a[f.id]).map(f => [f.id, 'no' as Answer])) }))}>
                «لا» لكل ما لم أُجب عنه في هذه الصفحة
              </button>
              <ul className="mt-3 space-y-3">
                {sec.factors.map(f => <li key={f.id}><FactorQuestion id={f.id} text={f.text} value={answers[f.id]} onChange={setAnswer} /></li>)}
              </ul>
            </div>
          );
        })()}

        {step.kind === 'review' && review && (
          <div data-testid="review-unknown">
            <h2 ref={headingRef} tabIndex={-1} className="flex items-center gap-2 text-xl font-extrabold"><ListChecks className="h-6 w-6 text-brand-600" aria-hidden="true" />مراجعة الإجابات غير المعروفة</h2>
            <p className="mt-1 muted">هذه فقط الأسئلة التي اخترتِ فيها «لا أعرف» أو لم تُجيبي عنها. إجاباتك الأخرى محفوظة كما هي.</p>
            <div className="mt-4 space-y-3">
              {review.age && <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"><AgeInput value={age} onChange={setAge} /></div>}
              {review.body && <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"><BodyInputs ht={ht} wt={wt} setHt={setHt} setWt={setWt} /></div>}
              <ul className="space-y-3">
                {review.ids.map(id => {
                  const f = allFactors.find(x => x.id === id)!;
                  return <li key={id}><FactorQuestion id={id} text={f.text} value={answers[id]} onChange={setAnswer} section={sectionOf(id).title} /></li>;
                })}
              </ul>
            </div>
            <p className="mt-3 text-sm muted">إن بقيتِ لا تعرفين الإجابة، اتركي «لا أعرف» واسألي طبيبك أو القابلة.</p>
            <button onClick={closeReview} className="btn-primary mt-4 w-full">اعرضي النتيجة المحدّثة <ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
          </div>
        )}

        {step.kind === 'result' && <Result result={result} headingRef={headingRef} onEdit={goTo} onReview={openReview} onReset={reset} openHelp={openHelp} />}

        {(step.kind === 'age' || step.kind === 'body' || step.kind === 'section') && (
          <div className="mt-6 flex gap-3">
            <button onClick={() => go(-1)} className="btn-secondary flex-1"><ArrowRight className="h-5 w-5" aria-hidden="true" /> السابق</button>
            <button onClick={() => go(1)} className="btn-primary flex-[2]">
              {i === LAST_QUESTION ? 'اعرضي النتيجة' : 'التالي'} <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const order = (id: string) => allFactors.findIndex(f => f.id === id);

function FactorQuestion({ id, text, value, onChange, section }: { id: string; text: string; value: Answer | undefined; onChange: (id: string, v: Answer) => void; section?: string }) {
  return (
    <fieldset className={`rounded-2xl border p-3 sm:p-4 ${value ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-300 dark:border-slate-700'}`} data-factor={id}>
      <legend className="sr-only">{text}</legend>
      {section && <p className="mb-1 text-xs font-bold muted">{section}</p>}
      <p className="mb-2 text-[17px] font-semibold leading-relaxed" aria-hidden="true">{text}</p>
      <div className="grid grid-cols-3 gap-2">
        {answerOpts.map(o => {
          const on = value === o.v;
          return (
            <label key={o.v} className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border-2 text-base font-bold transition ${on ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-500 dark:text-slate-950' : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'}`}>
              <input type="radio" className="sr-only" name={id} value={o.v} checked={on} onChange={() => onChange(id, o.v)} />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function AgeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const err = value.trim() !== '' && !validAge(parseNumber(value));
  return (
    <>
      <label className="block">
        <span className="mb-1 block font-semibold">العمر بالسنوات</span>
        <input className="field" type="text" inputMode="numeric" value={value} onChange={e => onChange(e.target.value)} placeholder="مثال: 28" aria-invalid={err} aria-describedby="age-err" data-field="age" />
      </label>
      {err && <p id="age-err" className="mt-2 font-semibold text-urgent-600 dark:text-urgent-100">أدخلي العمر بالسنوات الكاملة (رقم بين 12 و60).</p>}
    </>
  );
}

function BodyInputs({ ht, wt, setHt, setWt }: { ht: string; wt: string; setHt: (v: string) => void; setWt: (v: string) => void }) {
  const htN = parseNumber(ht), wtN = parseNumber(wt);
  const htErr = ht.trim() !== '' && !inRange(htN, validRanges.heightCm);
  const wtErr = wt.trim() !== '' && !inRange(wtN, validRanges.weightKg);
  const bmi = computeBmi(htN, wtN);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block font-semibold">الطول (سم)</span>
          <input className="field" type="text" inputMode="numeric" value={ht} onChange={e => setHt(e.target.value)} placeholder="160" aria-invalid={htErr} data-field="height" />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">الوزن (كجم)</span>
          <input className="field" type="text" inputMode="decimal" value={wt} onChange={e => setWt(e.target.value)} placeholder="65" aria-invalid={wtErr} data-field="weight" />
        </label>
      </div>
      {htErr && <p className="font-semibold text-urgent-600 dark:text-urgent-100">أدخلي الطول بالأرقام فقط، بين 120 و210 سم.</p>}
      {wtErr && <p className="font-semibold text-urgent-600 dark:text-urgent-100">أدخلي الوزن بالأرقام فقط، بين 30 و250 كجم.</p>}
      {bmi !== null && <p className="rounded-xl bg-brand-50 p-3 font-semibold dark:bg-brand-950" aria-live="polite">مؤشر كتلة الجسم: <span className="tabular">{displayBmi(bmi)}</span></p>}
    </div>
  );
}

function UrgentNote({ openHelp, title, text }: { openHelp: () => void; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-urgent-500 bg-urgent-50 p-3 sm:p-4 dark:bg-urgent-900/30">
      <Siren className="mt-0.5 h-6 w-6 shrink-0 text-urgent-600 dark:text-urgent-100" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        <p className="text-[15px]">{text}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={openHelp} className="btn-urgent min-h-[44px] px-4 text-[15px]">أحتاج إلى مساعدة طبية الآن</button>
        </div>
      </div>
    </div>
  );
}

function Result({ result, headingRef, onEdit, onReview, onReset, openHelp }: {
  result: RiskResult;
  headingRef: React.RefObject<HTMLHeadingElement>;
  onEdit: (k: Step['kind'], index?: number) => void;
  onReview: () => void;
  onReset: () => void;
  openHelp: () => void;
}) {
  const t = result.tier;
  const known = !t ? result.knownLevel : null;
  const unsure = result.unsureIds.length, unanswered = result.unansweredIds.length;
  const hasUnknown = !result.complete;
  const unknownItems = unsure + unanswered;

  const message = result.complete
    ? (t ? tierInfo[t].usual : '')
    : result.findings.length
      ? 'لديكِ عوامل خطورة تم تحديدها، ولكن توجد إجابات غير معروفة قد تؤثر على التصنيف النهائي. يُنصح بمراجعة المختص لتحديد مستوى الخطورة ومسار المتابعة المناسب.'
      : 'لم تذكري أي عامل خطورة حتى الآن، ولكن توجد إجابات غير معروفة، وعدم معرفة الإجابة لا يعني عدم وجود خطورة. لذلك لا يمكن اعتبار حملك منخفض الخطورة بناءً على هذا الاستبيان. يُنصح بمراجعة المختص لتحديد مستوى الخطورة ومسار المتابعة المناسب.';

  const levelTitle = t ? tierInfo[t].title : known ? tierInfo[known].title : null;
  const speech = [
    'نتائجك التثقيفية.', `حالة التقييم: ${result.complete ? 'مكتمل' : 'غير مكتمل'}.`,
    levelTitle ? (t ? levelTitle : `المستوى المعروف حتى الآن: ${levelTitle} على الأقل.`) : '',
    result.findings.length ? 'عوامل الخطورة التي ذكرتِها: ' + result.findings.map(f => f.text).join('، ') + '.' : '',
    message
  ].join(' ');

  return (
    <div className="space-y-4" aria-live="polite" data-testid="risk-result">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold sm:text-2xl">نتائجك التثقيفية</h2>
        <span data-testid="assessment-status" className={`chip border ${result.complete ? 'border-calm-300 bg-calm-50 text-calm-800 dark:border-calm-800 dark:bg-calm-900/40 dark:text-calm-200' : 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'}`}>
          {result.complete ? <CircleCheck className="h-4 w-4" aria-hidden="true" /> : <CircleDashed className="h-4 w-4" aria-hidden="true" />}
          حالة التقييم: {result.complete ? 'مكتمل' : 'غير مكتمل'}
        </span>
      </div>

      {/* Level: final tier (complete, or confirmed red) — or the level confirmed so far — or none */}
      {t ? (
        <div data-testid="level-card" data-level={t} className={`rounded-2xl border-2 p-4 ${tierStyle[t].box}`}>
          <p className="text-xs font-bold muted">{result.complete ? 'مستوى الخطورة' : 'مستوى الخطورة المعروف'}</p>
          <div className="mt-1 flex items-center gap-2.5">
            <span className={`h-4 w-4 shrink-0 rounded-full ${tierStyle[t].dot}`} aria-hidden="true" />
            <p className={`text-lg font-extrabold sm:text-xl ${tierStyle[t].text}`}>{tierInfo[t].title}</p>
          </div>
          <p className="mt-2 text-[16px] font-semibold">{tierInfo[t].usual}</p>
          <p className="mt-1 text-sm muted">المسار المعتاد: {tierInfo[t].place}</p>
          {hasUnknown && <p className="mt-2 text-[15px] font-semibold">توجد أيضًا إجابات غير معروفة، لكنها لا تُخفّض هذا المستوى.</p>}
        </div>
      ) : known ? (
        <div data-testid="level-card" data-level={known} data-known="at-least" className={`rounded-2xl border-2 border-dashed p-4 ${tierStyle[known].box}`}>
          <p className="text-xs font-bold muted">مستوى الخطورة المعروف حتى الآن</p>
          <div className="mt-1 flex items-center gap-2.5">
            <span className={`h-4 w-4 shrink-0 rounded-full ${tierStyle[known].dot}`} aria-hidden="true" />
            <p className={`text-lg font-extrabold sm:text-xl ${tierStyle[known].text}`}>{tierInfo[known].title} <span className="text-base">— على الأقل</span></p>
          </div>
          <p className="mt-2 text-[15px] font-semibold">قد يتغيّر التصنيف النهائي بعد معرفة الإجابات الناقصة، ولا يمكن أن يكون أقل من ذلك.</p>
        </div>
      ) : (
        <div data-testid="level-card" data-level="none" className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs font-bold muted">مستوى الخطورة</p>
          <p className="mt-1 text-lg font-extrabold">لا يمكن تحديده بعد</p>
        </div>
      )}

      {/* Short message */}
      {message && <p className="rounded-2xl bg-brand-50 p-4 text-[16px] font-semibold leading-relaxed dark:bg-brand-950" data-testid="result-message">{message}</p>}

      {/* Unknown answers */}
      {hasUnknown && (
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800" data-testid="unknown-summary">
          <p className="font-extrabold">الإجابات غير المعروفة</p>
          <ul className="mt-1 flex flex-wrap gap-2 text-sm">
            {unsure > 0 && <li className="chip bg-slate-100 dark:bg-slate-800"><span className="tabular">{unsure}</span> «لا أعرف»</li>}
            {unanswered > 0 && <li className="chip bg-slate-100 dark:bg-slate-800"><span className="tabular">{unanswered}</span> دون إجابة</li>}
            {result.missingAge && <li className="chip bg-slate-100 dark:bg-slate-800">العمر غير مُدخل</li>}
            {result.missingBody && <li className="chip bg-slate-100 dark:bg-slate-800">الطول أو الوزن غير مُدخل</li>}
          </ul>
          <button onClick={onReview} className="btn-primary mt-3 w-full">
            <ListChecks className="h-5 w-5" aria-hidden="true" /> مراجعة الإجابات غير المعروفة
            <span className="tabular rounded-full bg-white/20 px-2 text-sm">{unknownItems + (result.missingAge ? 1 : 0) + (result.missingBody ? 1 : 0)}</span>
          </button>
        </div>
      )}

      {/* Confirmed factors */}
      <div>
        <h3 className="mb-2 text-lg font-extrabold">عوامل الخطورة التي ذكرتِها</h3>
        {result.findings.length ? (
          <ul className="space-y-2" data-testid="findings">
            {result.findings.map(f => (
              <li key={f.id} data-finding={f.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <span className="min-w-0 font-semibold leading-relaxed">{f.text}</span>
                <span className={`chip shrink-0 py-0.5 text-sm text-white ${f.tier === 'red' ? 'bg-urgent-600' : 'bg-tier-amber'}`}>{f.tier === 'red' ? 'عامل مرتفع' : 'عامل متوسط'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">لم تذكري أيًّا من عوامل الخطورة المدرجة في الاستبيان.</p>
        )}
      </div>

      <SpeakButton text={speech} />

      <p className="text-sm muted">هذه نتيجة تثقيفية وليست تشخيصًا طبيًا أو قرارًا بمكان متابعتك. طبيبك هو من يحدد التصنيف النهائي، ويُعاد تقييم الخطورة في كل زيارة.</p>

      <div className="flex items-start gap-3 rounded-2xl border-2 border-urgent-500 bg-urgent-50 p-3 sm:p-4 dark:bg-urgent-900/30">
        <Siren className="mt-0.5 h-6 w-6 shrink-0 text-urgent-600 dark:text-urgent-100" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-bold">هذا التصنيف لا يقيّم أعراضك الآن.</p>
          <p className="text-[15px]">أي علامة خطر تحتاج تقييمًا طبيًا عاجلًا مهما كان تصنيف حملك، حتى لو كان «أخضر».</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={openHelp} className="btn-urgent min-h-[44px] px-4 text-[15px]">أحتاج إلى مساعدة طبية الآن</button>
            <Link to="/emergency" className="btn-secondary min-h-[44px] px-4 text-[15px]">علامات الخطر ومتى أراجع الطوارئ</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button onClick={() => onEdit('section', 0)} className="btn-secondary px-3"><Pencil className="h-5 w-5" aria-hidden="true" /> عدّلي إجاباتك</button>
        <Link to="/" className="btn-secondary px-3"><Home className="h-5 w-5" aria-hidden="true" /> الصفحة الرئيسية</Link>
        <button onClick={onReset} className="btn-ghost col-span-2 px-3"><RotateCcw className="h-5 w-5" aria-hidden="true" /> امسحي الإجابات وابدئي من جديد</button>
      </div>
      <Link to="/where" className="block text-center text-sm font-bold text-brand-700 underline-offset-4 hover:underline dark:text-brand-300">أين تكون المتابعة عادةً لكل تصنيف؟</Link>
    </div>
  );
}

