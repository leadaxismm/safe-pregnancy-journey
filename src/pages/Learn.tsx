import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronDown, GraduationCap, X, Star } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { SpeakButton } from '../components/SpeakButton';
import { Icon } from '../components/Icon';
import { learnCards, faq, quiz, videos, dailyTips } from '../content/learn';
import { track } from '../lib/analytics';

type Phase = 'start' | 'pre' | 'cards' | 'post' | 'rate' | 'done';

export default function Learn() {
  const [params, setParams] = useSearchParams();
  const q = params.get('tab');
  const tab = q === 'faq' ? 'faq' : q === 'tips' ? 'tips' : q === 'videos' && videos.length ? 'videos' : 'learn';
  const setTab = (t: string) => setParams(t === 'learn' ? {} : { tab: t }, { replace: true });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="تعلّمي خلال انتظارك" lead="محتوى قصير يمكنك إنهاؤه في 3–5 دقائق." icon={<GraduationCap className="h-6 w-6" />} />
      <div role="tablist" aria-label="أقسام التعلّم" className="mb-5 grid grid-flow-col gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
        {[['learn', 'تعلّمي في دقائق'], ['faq', 'أسئلة شائعة'], ['tips', 'نصائح يومية'], ...(videos.length ? [['videos', 'فيديوهات']] : [])].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`min-h-[44px] rounded-xl px-3 font-bold transition ${tab === k ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-800 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'learn' && <LearnFlow />}
      {tab === 'faq' && <Faq />}
      {tab === 'videos' && <Videos />}
      {tab === 'tips' && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dailyTips.map(t => (
            <li key={t.text} className="card flex items-center gap-4 p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-calm-50 text-calm-700 dark:bg-calm-900/40 dark:text-calm-300"><Icon name={t.icon} /></span>
              <span className="text-[17px] font-bold">{t.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LearnFlow() {
  const [phase, setPhase] = useState<Phase>('start');
  const [pre, setPre] = useState<number | null>(null);
  const [post, setPost] = useState<number | null>(null);
  const [card, setCard] = useState(0);
  const [rating, setRating] = useState<number | null>(null);

  if (phase === 'start') return (
    <div className="card space-y-4 p-6 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"><GraduationCap className="h-8 w-8" aria-hidden="true" /></div>
      <h2 className="text-xl font-extrabold">ابدئي باختبار قصير من 5 أسئلة</h2>
      <p className="muted">لتعرفي معلوماتك قبل التعلّم وبعده. لا توجد إجابة تُحسب عليكِ، والنتائج مجهولة الهوية.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="btn-primary" onClick={() => { track('learn_started'); setPhase('pre'); }}>ابدئي الاختبار</button>
        <button className="btn-secondary" onClick={() => { track('learn_started'); setPhase('cards'); }}>تخطّي إلى البطاقات</button>
      </div>
    </div>
  );

  if (phase === 'pre') return <Quiz key="pre" mode="pre" onDone={s => { setPre(s); track('quiz_pre', { value: s }); setPhase('cards'); }} />;

  if (phase === 'cards') {
    const c = learnCards[card];
    const last = card === learnCards.length - 1;
    return (
      <div>
        <div className="mb-3 flex justify-center gap-1.5" aria-hidden="true">
          {learnCards.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === card ? 'w-6 bg-brand-600' : i < card ? 'w-2 bg-brand-300' : 'w-2 bg-slate-300 dark:bg-slate-700'}`} />)}
        </div>
        <article className="card overflow-hidden fade-in" key={c.id} aria-label={`بطاقة ${card + 1} من ${learnCards.length}`}>
          <div className="flex items-center gap-4 bg-gradient-to-bl from-brand-50 to-calm-50 p-6 dark:from-brand-950 dark:to-calm-900/40">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300"><Icon name={c.icon} className="h-8 w-8" /></div>
            <div>
              <div className="text-sm font-bold muted tabular">{card + 1} / {learnCards.length}</div>
              <h2 className="text-xl font-extrabold">{c.title}</h2>
            </div>
          </div>
          <div className="p-6">
            <ul className="space-y-2.5 text-[17px] leading-relaxed">
              {c.points.map(p => <li key={p} className="flex gap-2"><Check className="mt-1.5 h-5 w-5 shrink-0 text-calm-600" aria-hidden="true" />{p}</li>)}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <SpeakButton text={`${c.title}. ${c.points.join('. ')}`} />
              {c.link && <Link to={c.link.to} className="text-sm font-bold text-brand-700 underline underline-offset-4 dark:text-brand-300">{c.link.label}</Link>}
            </div>
          </div>
        </article>
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary flex-1" disabled={card === 0} onClick={() => setCard(x => x - 1)}><ArrowRight className="h-5 w-5" aria-hidden="true" />السابقة</button>
          <button className="btn-primary flex-[2]" onClick={() => (last ? setPhase('post') : setCard(x => x + 1))}>
            {last ? 'الاختبار الختامي' : 'التالية'} <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'post') return (
    <Quiz key="post" mode="post" onDone={(s, dangerAll) => {
      setPost(s);
      track('quiz_post', { value: s });
      track('quiz_danger_known', { value: dangerAll ? 1 : 0 });
      track('learn_completed');
      setPhase('rate');
    }} />
  );

  if (phase === 'rate') return (
    <div className="card space-y-4 p-6 text-center">
      <h2 className="text-xl font-extrabold">ما مدى رضاكِ عن هذه التجربة؟</h2>
      <div className="flex justify-center gap-2" role="radiogroup" aria-label="التقييم من 1 إلى 5">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} من 5`} onClick={() => setRating(n)}
            className={`grid h-14 w-14 place-items-center rounded-2xl border-2 transition ${rating !== null && n <= rating ? 'border-brand-600 bg-brand-50 text-brand-600 dark:bg-brand-950' : 'border-slate-200 text-slate-400 dark:border-slate-700'}`}>
            <Star className="h-7 w-7" fill={rating !== null && n <= rating ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="btn-primary" disabled={rating === null} onClick={() => { track('satisfaction', { value: rating! }); setPhase('done'); }}>إرسال التقييم</button>
        <button className="btn-secondary" onClick={() => setPhase('done')}>تخطّي</button>
      </div>
    </div>
  );

  return (
    <div className="card space-y-4 p-6 text-center fade-in">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-calm-50 text-calm-700 dark:bg-calm-900/40 dark:text-calm-300"><Check className="h-8 w-8" aria-hidden="true" /></div>
      <h2 className="text-xl font-extrabold">أحسنتِ! أنهيتِ رحلة التعلّم</h2>
      {post !== null && (
        <div className="mx-auto grid max-w-sm grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800"><div className="text-sm muted">قبل</div><div className="text-2xl font-extrabold tabular">{pre ?? '—'} / {quiz.length}</div></div>
          <div className="rounded-2xl bg-calm-50 p-3 dark:bg-calm-900/40"><div className="text-sm muted">بعد</div><div className="text-2xl font-extrabold tabular text-calm-700 dark:text-calm-300">{post} / {quiz.length}</div></div>
        </div>
      )}
      <p>تذكّري: عند أي علامة خطر لا تنتظري، اطلبي المساعدة فورًا.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/journey" className="btn-secondary">رحلة متابعة حملك</Link>
        <Link to="/" className="btn-primary">الصفحة الرئيسية</Link>
      </div>
    </div>
  );
}

function Quiz({ mode, onDone }: { mode: 'pre' | 'post'; onDone: (score: number, dangerAllCorrect: boolean) => void }) {
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const q = quiz[i];
  const pick = picks[i];
  const showFeedback = mode === 'post' && revealed;

  const next = () => {
    if (mode === 'post' && !revealed) { setRevealed(true); return; }
    setRevealed(false);
    if (i < quiz.length - 1) setI(i + 1);
    else {
      const score = quiz.reduce((s, qq, k) => s + (picks[k] === qq.correct ? 1 : 0), 0);
      const danger = quiz.every((qq, k) => !qq.dangerSign || picks[k] === qq.correct);
      onDone(score, danger);
    }
  };

  return (
    <div className="card p-6">
      <div className="mb-1 text-sm font-bold muted">{mode === 'pre' ? 'اختبار قبل التعلّم' : 'الاختبار الختامي'} · <span className="tabular">{i + 1} / {quiz.length}</span></div>
      <h2 className="text-xl font-extrabold leading-snug">{q.q}</h2>
      <div className="mt-4 space-y-2" role="radiogroup" aria-label={q.q}>
        {q.options.map((o, k) => {
          const on = pick === k;
          const isCorrect = k === q.correct;
          let cls = on ? 'border-brand-600 bg-brand-50 dark:bg-brand-950' : 'border-slate-200 hover:border-brand-300 dark:border-slate-700';
          if (showFeedback && isCorrect) cls = 'border-calm-600 bg-calm-50 dark:bg-calm-900/40';
          else if (showFeedback && on && !isCorrect) cls = 'border-urgent-500 bg-urgent-50 dark:bg-urgent-900/30';
          return (
            <button key={k} role="radio" aria-checked={on} disabled={showFeedback}
              onClick={() => setPicks(p => { const n = [...p]; n[i] = k; return n; })}
              className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-2 text-start text-[17px] font-semibold transition ${cls}`}>
              <span className="flex-1">{o}</span>
              {showFeedback && isCorrect && <Check className="h-5 w-5 text-calm-600" aria-label="الإجابة الصحيحة" />}
              {showFeedback && on && !isCorrect && <X className="h-5 w-5 text-urgent-600" aria-label="إجابة غير صحيحة" />}
            </button>
          );
        })}
      </div>
      {showFeedback && (
        <p className={`mt-4 rounded-xl p-3 font-semibold ${pick === q.correct ? 'bg-calm-50 dark:bg-calm-900/40' : 'bg-slate-100 dark:bg-slate-800'}`} aria-live="polite">
          {pick === q.correct ? 'إجابة صحيحة! ' : 'الإجابة الصحيحة: ' + q.options[q.correct] + '. '}{q.explain}
        </p>
      )}
      <button className="btn-primary mt-5 w-full" disabled={pick === undefined} onClick={next}>
        {mode === 'post' && !revealed ? 'تحقّقي من الإجابة' : i < quiz.length - 1 ? 'السؤال التالي' : 'إنهاء'}
      </button>
    </div>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="space-y-2">
      {faq.map((f, k) => (
        <li key={f.q} className="card overflow-hidden">
          <button className="flex w-full items-center gap-3 p-4 text-start text-[17px] font-bold" aria-expanded={open === k} onClick={() => setOpen(o => (o === k ? null : k))}>
            <span className="flex-1">{f.q}</span>
            <ChevronDown className={`h-5 w-5 shrink-0 transition ${open === k ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {open === k && (
            <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
              <p className="text-[16px] leading-relaxed">{f.a}</p>
              <SpeakButton text={`${f.q} ${f.a}`} className="mt-3" />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Videos() {
  return (
    <ul className="space-y-4">
      {videos.map(v => (
        <li key={v.id} className="card overflow-hidden">
          <video controls preload="none" poster={v.poster} className="aspect-video w-full bg-black">
            <source src={v.src} />
            {v.captions && <track kind="captions" srcLang="ar" src={v.captions} default />}
          </video>
          <p className="p-4 font-bold">{v.title}</p>
        </li>
      ))}
    </ul>
  );
}
