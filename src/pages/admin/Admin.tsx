import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, FileCheck2, LogOut, QrCode, Activity, TriangleAlert, KeyRound, Lock, FlaskConical, Database } from 'lucide-react';
import { getAdminApi, getDemoApi, type AdminApi, type Stats, type EdRow, type Approval, type StaffSession } from '../../lib/adminApi';
import { topicLabels, qrLocations } from '../../content/locations';
import { contentMeta, statusLabel } from '../../content/meta';
import { config } from '../../lib/config';
import { quiz } from '../../content/learn';

type Tab = 'overview' | 'impact' | 'governance' | 'qr';
const envLabel: Record<string, string> = { preview: 'نسخة المراجعة (preview)', production: 'الإنتاج (production)', test: 'بيانات الاختبار الآلي (test)' };
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const fmt = (n: number | null | undefined, d = 0) => (n === null || n === undefined ? '—' : n.toLocaleString('ar-SA-u-nu-latn', { maximumFractionDigits: d }));
/** "Not available" when there is no data — never show 0 % or a fake average */
const NA = 'غير متاح';

/** Data-source context: real vs demo, plus the staff role (viewer/editor) for UI gating. */
const SourceCtx = createContext<{ demo: boolean; canEdit: boolean }>({ demo: false, canEdit: false });
const useSource = () => useContext(SourceCtx);

function useNoIndex(title: string) {
  useEffect(() => {
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
    document.title = title;
    return () => { m.remove(); document.title = 'رحلة الحمل الآمن | Safe Pregnancy Journey'; };
  }, [title]);
}

/** #/admin — real staff dashboard. Supabase Auth only; there is no demo fallback here. */
export default function Admin() {
  useNoIndex('لوحة الإدارة · رحلة الحمل الآمن');
  const apiP = useMemo(() => getAdminApi(), []);
  const [api, setApi] = useState<AdminApi | null>(null);
  const [session, setSession] = useState<StaffSession | null | undefined>(undefined);
  useEffect(() => { apiP?.then(async a => { setApi(a); setSession(await a.getSession()); }).catch(() => setSession(null)); }, [apiP]);

  if (!apiP) return (
    <Centered>
      <Database className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
      <h1 className="mt-3 text-xl font-extrabold">لوحة الإدارة غير مهيأة</h1>
      <p className="mt-2 muted">لم يتم ربط قاعدة البيانات في هذه النسخة، لذلك لا يمكن الدخول إلى لوحة الإدارة. لا توجد بيانات تجريبية في هذا المسار.</p>
      <Link to="/" className="btn-secondary mt-5">العودة إلى المنصة</Link>
    </Centered>
  );
  if (!api || session === undefined) return <div className="p-10 text-center">جارٍ التحميل…</div>;
  if (!session) return <Login api={api} onIn={s => setSession(s)} />;
  return (
    <SourceCtx.Provider value={{ demo: false, canEdit: session.role === 'editor' }}>
      <Dashboard api={api} session={session} onOut={async () => { await api.signOut(); setSession(null); }} />
    </SourceCtx.Provider>
  );
}

/** #/admin-demo — separate, read-only dashboard with SAMPLE numbers. No sign-in, no writes, no database. */
export function DemoAdmin() {
  useNoIndex('عرض تجريبي · لوحة الإدارة');
  const api = useMemo(() => getDemoApi(), []);
  return (
    <SourceCtx.Provider value={{ demo: true, canEdit: false }}>
      <Dashboard api={api} session={null} onOut={() => {}} />
    </SourceCtx.Provider>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="grid min-h-dvh place-items-center p-4"><div className="card w-full max-w-md p-8 text-center">{children}</div></div>;
}

function Login({ api, onIn }: { api: AdminApi; onIn: (s: StaffSession) => void }) {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <form className="card w-full max-w-sm space-y-4 p-6" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setErr('');
        try { onIn(await api.signIn(email.trim(), pw)); }
        catch (x) { setErr((x as Error).message === 'not_authorized' ? 'هذا الحساب غير مخوّل بالدخول إلى لوحة الإدارة.' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'); }
        finally { setBusy(false); setPw(''); }
      }}>
        <div className="flex items-center gap-2"><Lock className="h-6 w-6 text-brand-600" aria-hidden="true" /><h1 className="text-xl font-extrabold">دخول الموظفين المخوّلين</h1></div>
        <p className="text-sm muted">لوحة الإدارة مخصصة لفريق المشروع. المنصة التثقيفية للمريضات لا تحتاج إلى تسجيل دخول. لا يوجد تسجيل حسابات جديدة؛ الحسابات يضيفها مسؤول النظام.</p>
        <label className="block"><span className="mb-1 block font-semibold">البريد الإلكتروني</span><input className="field text-base" dir="ltr" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="block"><span className="mb-1 block font-semibold">كلمة المرور</span><input className="field text-base" dir="ltr" type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} required /></label>
        {err && <p className="font-semibold text-urgent-600" role="alert">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'جارٍ التحقق…' : 'دخول'}</button>
        <Link to="/" className="btn-ghost w-full text-sm">العودة إلى المنصة</Link>
      </form>
    </div>
  );
}

function ChangePassword({ api }: { api: AdminApi }) {
  const [open, setOpen] = useState(false); const [a, setA] = useState(''); const [b, setB] = useState(''); const [msg, setMsg] = useState('');
  if (!open) return <button onClick={() => setOpen(true)} className="btn-secondary min-h-[40px] px-3 text-sm"><KeyRound className="h-4 w-4" />تغيير كلمة المرور</button>;
  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={async e => {
      e.preventDefault(); setMsg('');
      if (a.length < 12) return setMsg('12 حرفًا على الأقل.');
      if (a !== b) return setMsg('كلمتا المرور غير متطابقتين.');
      try { await api.changePassword(a); setMsg('تم التغيير.'); setA(''); setB(''); setTimeout(() => setOpen(false), 1500); } catch { setMsg('تعذّر التغيير.'); }
    }}>
      <input className="field h-10 min-h-0 w-40 text-sm" dir="ltr" type="password" autoComplete="new-password" placeholder="كلمة جديدة" value={a} onChange={e => setA(e.target.value)} />
      <input className="field h-10 min-h-0 w-40 text-sm" dir="ltr" type="password" autoComplete="new-password" placeholder="تأكيدها" value={b} onChange={e => setB(e.target.value)} />
      <button className="btn-primary min-h-[40px] px-3 text-sm">حفظ</button>
      <button type="button" className="btn-ghost min-h-[40px] px-2 text-sm" onClick={() => setOpen(false)}>إلغاء</button>
      {msg && <span className="text-sm font-semibold" role="status">{msg}</span>}
    </form>
  );
}

function Dashboard({ api, session, onOut }: { api: AdminApi; session: StaffSession | null; onOut: () => void }) {
  const { demo } = useSource();
  const [tab, setTab] = useState<Tab>('overview');
  const [range, setRange] = useState<'month' | '3m' | '6m' | 'year'>('6m');
  const [env, setEnv] = useState<string>(config.appEnv === 'test' ? 'test' : config.appEnv);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ed, setEd] = useState<EdRow[]>([]);
  const [err, setErr] = useState('');
  const { from, to } = useMemo(() => {
    const to = new Date(); const from = new Date();
    const months = { month: 1, '3m': 3, '6m': 6, year: 12 }[range];
    from.setMonth(from.getMonth() - months + 1, 1); from.setHours(0, 0, 0, 0);
    to.setDate(to.getDate() + 1);
    return { from, to };
  }, [range]);

  useEffect(() => {
    setErr(''); setStats(null);
    api.stats(from, to, env).then(setStats).catch(() => setErr('تعذّر تحميل الإحصائيات. تأكد من صلاحية حسابك.'));
    api.ed().then(setEd).catch(() => {});
  }, [api, from, to, env]);

  const sourceLabel = demo ? 'بيانات تجريبية (عيّنة) — ليست نتائج فعلية' : `بيانات فعلية مجمّعة · البيئة: ${envLabel[env] ?? env}`;

  const exportXlsx = async () => {
    if (!stats) return;
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const v = (n: number | null, N: number) => (N > 0 && n !== null ? n : NA);
    const summary = [
      ['المؤشر', 'القيمة'],
      ['مصدر البيانات', sourceLabel],
      ['الفترة', `${from.toISOString().slice(0, 10)} → ${to.toISOString().slice(0, 10)}`],
      ['تاريخ الإنشاء', new Date().toISOString()],
      ['عدد الزيارات', stats.visits],
      ['مشاهدات الصفحات', stats.pageViews],
      ['المستفيدات من المحتوى التثقيفي (بدء التعلّم)', stats.learnStarted],
      ['إكمال رحلة التعلّم', stats.learnCompleted],
      ['نسبة إكمال التعلّم %', stats.learnStarted ? pct(stats.learnCompleted, stats.learnStarted) : NA],
      ['استبيانات عوامل الخطورة المكتملة', stats.riskCompleted],
      ['منها بإجابات كاملة', stats.riskCompletedFull],
      [`متوسط الاختبار القبلي (من ${quiz.length})`, v(stats.preAvg, stats.preN)],
      [`متوسط الاختبار البعدي (من ${quiz.length})`, v(stats.postAvg, stats.postN)],
      ['نسبة معرفة علامات الخطر بعد التثقيف %', v(stats.dangerKnownPct, stats.dangerN)],
      ['متوسط الرضا (من 5)', v(stats.satisfactionAvg, stats.satisfactionN)],
      ['نسبة الرضا (4–5 نجوم) %', stats.satisfactionN ? pct((stats.satisfactionDist[3] ?? 0) + (stats.satisfactionDist[4] ?? 0), stats.satisfactionN) : NA],
      ['فتح زر «أحتاج إلى مساعدة طبية الآن»', stats.helpOpened],
      ['أثر المبادرة على الطوارئ', ed.length ? 'اتجاه فقط — لا يثبت أثرًا دون تحليل مقارن معتمد' : 'غير متاح — لا توجد بيانات تشغيلية معتمدة']
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'الملخص');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.monthly.map(m => ({
      'الشهر': m.month, 'الزيارات': m.visits, 'استبيانات مكتملة': m.riskCompleted, 'بدء التعلّم': m.learnStarted, 'إكمال التعلّم': m.learnCompleted,
      'نسبة الإكمال %': m.learnStarted ? pct(m.learnCompleted, m.learnStarted) : NA, 'متوسط قبلي': m.preAvg ?? NA, 'متوسط بعدي': m.postAvg ?? NA,
      'معرفة علامات الخطر %': m.dangerKnownPct ?? NA, 'متوسط الرضا': m.satisfactionAvg ?? NA
    }))), 'تقرير شهري');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.topTopics.map(t => ({ 'الموضوع': topicLabels[t.topic] ?? t.topic, 'المشاهدات': t.views }))), 'الموضوعات');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.sources.map(t => ({ 'مصدر الدخول': topicLabels[t.topic] ?? t.topic, 'الزيارات': t.views }))), 'مواقع رمز QR');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ed.map(e => ({ 'الشهر': e.month, 'إجمالي زيارات الطوارئ': e.total_visits, 'الزيارات غير العاجلة': e.nonurgent_visits, 'النسبة %': pct(e.nonurgent_visits, e.total_visits), 'المصدر': e.source }))), 'الطوارئ');
    wb.Workbook = { Views: [{ RTL: true }] } as any;
    XLSX.writeFile(wb, `safe-pregnancy-report-${demo ? 'DEMO-' : ''}${env}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const tabs: [Tab, string, ReactNode][] = [
    ['overview', 'نظرة عامة', <BarChart3 key="a" className="h-5 w-5" />],
    ['impact', 'أثر المبادرة', <Activity key="b" className="h-5 w-5" />],
    ['governance', 'حوكمة المحتوى', <FileCheck2 key="c" className="h-5 w-5" />],
    ['qr', 'رموز QR', <QrCode key="d" className="h-5 w-5" />]
  ];

  return (
    <div className="min-h-dvh">
      <div className={`px-4 py-2 text-center text-sm font-bold ${demo ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-calm-50 text-calm-800 dark:bg-calm-900/40 dark:text-calm-200'}`} role="note">
        {demo ? <><FlaskConical className="inline h-4 w-4" aria-hidden="true" /> عرض تجريبي منفصل: كل الأرقام عيّنة مصطنعة لاستعراض التصميم فقط، وليست نتائج فعلية. لا يمكن من هنا تعديل أو اعتماد أي شيء.</> : <><Database className="inline h-4 w-4" aria-hidden="true" /> {sourceLabel}</>}
      </div>
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-lg font-extrabold text-brand-700 dark:text-brand-300">لوحة مؤشرات الجودة · رحلة الحمل الآمن</div>
            <div className="text-xs muted">إحصائيات مجمّعة ومجهولة الهوية{session && <> · <span dir="ltr">{session.email}</span> · {session.role === 'editor' ? 'صلاحية تعديل' : 'صلاحية اطلاع'}</>}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/" className="btn-ghost min-h-[40px] px-3 text-sm">المنصة</Link>
            {session && <ChangePassword api={api} />}
            {session && <button onClick={onOut} className="btn-secondary min-h-[40px] px-3 text-sm"><LogOut className="h-4 w-4" />خروج</button>}
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4" aria-label="أقسام لوحة الإدارة">
          {tabs.map(([k, l, ic]) => (
            <button key={k} onClick={() => setTab(k)} aria-current={tab === k}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 border-b-[3px] px-3 font-bold ${tab === k ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent muted'}`}>{ic}{l}</button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {(tab === 'overview' || tab === 'impact') && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900" role="group" aria-label="الفترة">
                {([['month', 'هذا الشهر'], ['3m', '3 أشهر'], ['6m', '6 أشهر'], ['year', 'سنة']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setRange(k)} aria-pressed={range === k} className={`min-h-[40px] rounded-lg px-3 text-sm font-bold ${range === k ? 'bg-white shadow-sm dark:bg-slate-800' : 'muted'}`}>{l}</button>
                ))}
              </div>
              {!demo && (
                <label className="flex items-center gap-2 text-sm font-bold">البيئة
                  <select className="field h-11 min-h-0 w-auto py-0 text-sm" value={env} onChange={e => setEnv(e.target.value)}>
                    {Object.entries(envLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </label>
              )}
            </div>
            <button onClick={exportXlsx} disabled={!stats} className="btn-primary min-h-[44px] text-sm"><Download className="h-4 w-4" />تصدير التقرير إلى Excel</button>
          </div>
        )}
        {err && <p className="rounded-xl bg-urgent-50 p-3 font-semibold text-urgent-700">{err}</p>}
        {(tab === 'overview' || tab === 'impact') && !stats && !err && <p className="muted">جارٍ تحميل البيانات…</p>}
        {tab === 'overview' && stats && <Overview s={stats} />}
        {tab === 'impact' && stats && <Impact s={stats} ed={ed} api={api} onSaved={() => api.ed().then(setEd)} />}
        {tab === 'governance' && <Governance api={api} />}
        {tab === 'qr' && <QrPanel />}
      </main>
    </div>
  );
}

function Kpi({ label, value, sub, ltr }: { label: string; value: string; sub?: string; ltr?: boolean }) {
  const { demo } = useSource();
  return (
    <div className={`card relative p-4 ${demo ? 'border-dashed' : ''}`}>
      <div className="flex items-start justify-between gap-2 text-sm font-semibold muted"><span>{label}</span>{demo && <span className="shrink-0 rounded-full bg-amber-100 px-2 text-[11px] font-bold text-amber-900">عيّنة</span>}</div>
      <div dir={ltr && value !== NA ? 'ltr' : undefined} className={`mt-1 text-right font-extrabold tabular ${value === NA ? 'text-xl text-slate-400' : 'text-3xl text-slate-900 dark:text-white'}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs muted">{sub}</div>}
    </div>
  );
}

function Bars({ rows, color = 'bg-brand-600' }: { rows: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <ul className="space-y-2">
      {rows.map(r => (
        <li key={r.label} className="grid grid-cols-[minmax(110px,180px)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate font-semibold">{r.label}</span>
          <span className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><span className={`block h-full rounded-full ${color}`} style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="w-14 text-end font-bold tabular">{fmt(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

const avg = (v: number | null, n: number, d = 2) => (n > 0 && v !== null ? fmt(v, d) : NA);
const rate = (a: number, b: number) => (b > 0 ? `${pct(a, b)}%` : NA);
const satPct = (s: Stats) => (s.satisfactionN > 0 ? `${pct((s.satisfactionDist[3] ?? 0) + (s.satisfactionDist[4] ?? 0), s.satisfactionN)}%` : NA);

function Empty({ text = 'لا توجد بيانات في هذه الفترة.' }: { text?: string }) {
  return <p className="rounded-xl bg-slate-50 p-4 text-center text-sm font-semibold text-slate-500 dark:bg-slate-900">{text}</p>;
}

function Overview({ s }: { s: Stats }) {
  const { demo } = useSource();
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label={demo ? 'الزيارات' : 'الزيارات الفعلية'} value={fmt(s.visits)} sub={`${fmt(s.pageViews)} مشاهدة صفحة`} />
        <Kpi label="المستفيدات من التثقيف" value={fmt(s.learnStarted)} sub="بدأن رحلة التعلّم" />
        <Kpi label="استبيانات مكتملة" value={fmt(s.riskCompleted)} sub={s.riskCompleted ? `${pct(s.riskCompletedFull, s.riskCompleted)}% بإجابات كاملة` : undefined} />
        <Kpi label="معدل إكمال التثقيف" value={rate(s.learnCompleted, s.learnStarted)} sub={`${fmt(s.learnCompleted)} من ${fmt(s.learnStarted)}`} />
        <Kpi label="نسبة الرضا (4–5 نجوم)" value={satPct(s)} sub={s.satisfactionN ? `متوسط ${fmt(s.satisfactionAvg, 1)} من 5 · ${fmt(s.satisfactionN)} تقييم` : 'لا توجد تقييمات'} />
        <Kpi label="يعرفن علامات الخطر" value={s.dangerN ? `${fmt(s.dangerKnownPct, 1)}%` : NA} sub="بعد التثقيف" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-extrabold">أكثر الموضوعات مشاهدة</h2>
          {s.topTopics.length ? <Bars rows={s.topTopics.map(t => ({ label: topicLabels[t.topic] ?? t.topic, value: t.views }))} /> : <Empty />}
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-extrabold">مصدر الدخول (موقع رمز QR)</h2>
          {s.sources.length ? <Bars color="bg-calm-600" rows={s.sources.map(t => ({ label: topicLabels[t.topic] ?? t.topic, value: t.views }))} /> : <Empty />}
        </section>
        <section className="card p-5">
          <h2 className="mb-1 text-lg font-extrabold">نتائج الاختبارات المعرفية (مجمّعة)</h2>
          <p className="mb-4 text-sm muted">متوسط الدرجة من {quiz.length} · القبلي {fmt(s.preN)} مشاركة · البعدي {fmt(s.postN)} مشاركة</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><div className="text-sm muted">قبل</div><div className="text-2xl font-extrabold tabular">{avg(s.preAvg, s.preN)}</div></div>
            <div className="rounded-xl bg-calm-50 p-3 dark:bg-calm-900/40"><div className="text-sm muted">بعد</div><div className="text-2xl font-extrabold tabular text-calm-700 dark:text-calm-300">{avg(s.postAvg, s.postN)}</div></div>
            <div className="rounded-xl bg-brand-50 p-3 dark:bg-brand-950"><div className="text-sm muted">يعرفن علامات الخطر</div><div className="text-2xl font-extrabold tabular">{s.dangerN ? `${fmt(s.dangerKnownPct, 1)}%` : NA}</div></div>
          </div>
          <p className="mt-3 text-xs muted">ملاحظة: المشاركات في الاختبارين مجهولة وغير مرتبطة ببعضها، لذا تمثل الأرقام متوسط المجموعة لا تحسّن كل مستفيدة.</p>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-extrabold">توزيع تقييم الرضا</h2>
          {s.satisfactionN ? <Bars color="bg-brand-400" rows={[5, 4, 3, 2, 1].map(n => ({ label: `${n} ${'★'.repeat(n)}`, value: s.satisfactionDist[n - 1] ?? 0 }))} /> : <Empty text="لا توجد تقييمات رضا بعد." />}
          <p className="mt-4 text-sm muted">فتح زر «أحتاج إلى مساعدة طبية الآن»: <b className="tabular">{fmt(s.helpOpened)}</b> · فتح صفحة الأعراض: <b className="tabular">{fmt(s.symptomOpened)}</b></p>
        </section>
      </div>
      <section className="card overflow-x-auto p-5">
        <h2 className="mb-3 text-lg font-extrabold">اتجاهات الاستخدام الشهرية</h2>
        {s.monthly.length > 0 && <MonthlyTrend rows={s.monthly} />}
        {!s.monthly.length ? <Empty /> : <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-slate-200 text-start dark:border-slate-800">{['الشهر', 'الزيارات', 'استبيانات', 'بدء التعلّم', 'إكمال', 'قبلي', 'بعدي', 'علامات الخطر', 'الرضا'].map(h => <th key={h} className="py-2 text-start font-bold">{h}</th>)}</tr></thead>
          <tbody className="tabular">
            {s.monthly.map(m => (
              <tr key={m.month} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2 font-bold">{m.month}</td><td>{fmt(m.visits)}</td><td>{fmt(m.riskCompleted)}</td><td>{fmt(m.learnStarted)}</td>
                <td>{rate(m.learnCompleted, m.learnStarted)}</td><td>{m.preAvg ?? NA}</td><td>{m.postAvg ?? NA}</td>
                <td>{m.dangerKnownPct !== null ? `${fmt(m.dangerKnownPct, 1)}%` : NA}</td><td>{m.satisfactionAvg ?? NA}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </section>
    </>
  );
}

function MonthlyTrend({ rows }: { rows: Stats['monthly'] }) {
  const max = Math.max(1, ...rows.map(r => r.visits));
  return (
    <div className="mb-5 flex h-40 items-end gap-2" role="img" aria-label="عدد الزيارات الشهرية">
      {rows.map(r => (
        <div key={r.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-xs font-bold tabular">{fmt(r.visits)}</span>
          <span className="w-full max-w-[56px] rounded-t-lg bg-brand-500" style={{ height: `${(r.visits / max) * 75}%` }} />
          <span className="text-[11px] tabular muted">{r.month}</span>
        </div>
      ))}
    </div>
  );
}

function Impact({ s, ed, api, onSaved }: { s: Stats; ed: EdRow[]; api: AdminApi; onSaved: () => void }) {
  const { demo, canEdit } = useSource();
  const [form, setForm] = useState<EdRow>({ month: new Date().toISOString().slice(0, 7), total_visits: 0, nonurgent_visits: 0, source: '' });
  const [msg, setMsg] = useState('');
  const launch = s.monthly[0]?.month;
  const maxPct = Math.max(1, ...ed.map(e => pct(e.nonurgent_visits, e.total_visits)));
  return (
    <>
      <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-[15px] dark:border-amber-800 dark:bg-amber-950/40">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <p className="font-bold">لا يمكن الاستنتاج أن المنصة خفّضت زيارات الطوارئ من عدد المستخدمات وحده.</p>
          <p>قياس الأثر الفعلي يتطلب بيانات تشغيلية معتمدة قبل الإطلاق وبعده (مثلًا سلسلة زمنية متقطعة لـ 6–12 شهرًا قبل وبعد)، مع مراعاة العوامل الأخرى: الموسمية، تغيّر أعداد الولادات، تغيّر سياسات الفرز، وافتتاح خدمات جديدة. يُفضّل تحليل ذلك مع وحدة الجودة.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label="1. عدد المستفيدات" value={fmt(s.visits)} />
        <Kpi label="2. نسبة إكمال رحلة التثقيف" value={rate(s.learnCompleted, s.learnStarted)} />
        <Kpi label="3. المعرفة: قبل ← بعد" value={s.preN && s.postN ? `${fmt(s.preAvg, 1)} ← ${fmt(s.postAvg, 1)}` : NA} sub={`متوسط الدرجة من ${quiz.length}`} />
        <Kpi label="4. يعرفن علامات الخطر" value={s.dangerN ? `${fmt(s.dangerKnownPct, 1)}%` : NA} sub="إجابة صحيحة عن كل أسئلة علامات الخطر" />
        <Kpi label="5. رضا المستفيدات" value={satPct(s)} sub="نسبة تقييم 4–5 نجوم" />
        <Kpi label="6. الزيارات غير العاجلة للطوارئ" value={ed.length ? `${pct(ed[ed.length - 1].nonurgent_visits, ed[ed.length - 1].total_visits)}%` : NA} sub={ed.length ? `اتجاه فقط · آخر شهر: ${ed[ed.length - 1].month}` : 'لا توجد بيانات تشغيلية معتمدة'} />
      </div>
      <section className="card p-5">
        <h2 className="mb-1 text-lg font-extrabold">اتجاه الزيارات غير العاجلة للطوارئ (% من الإجمالي)</h2>
        <p className="mb-4 text-sm muted">بيانات تشغيلية مجمّعة تُدخل يدويًا من التقارير المعتمدة. الخط المتقطع يشير إلى بداية تشغيل المنصة{launch ? ` (${launch})` : ''}.</p>
        {ed.length ? (
          <div className="flex h-56 items-end gap-2 overflow-x-auto pb-6" role="img" aria-label="رسم بياني لنسبة الزيارات غير العاجلة شهريًا">
            {ed.map(e => {
              const p = pct(e.nonurgent_visits, e.total_visits);
              const after = launch && e.month >= launch;
              return (
                <div key={e.month} className={`relative flex h-full min-w-[44px] flex-1 flex-col items-center justify-end ${launch === e.month ? 'border-s-2 border-dashed border-slate-400' : ''}`}>
                  <span className="mb-1 text-xs font-bold tabular">{p}%</span>
                  <span className={`w-full max-w-[40px] rounded-t-md ${after ? 'bg-calm-600' : 'bg-slate-400'}`} style={{ height: `${(p / maxPct) * 80}%` }} />
                  <span className="absolute -bottom-6 text-[11px] tabular muted">{e.month.slice(2)}</span>
                </div>
              );
            })}
          </div>
        ) : <Empty text="غير متاح: لم تُدخل بيانات تشغيلية معتمدة من قسم الطوارئ بعد. لن يُعرض أي أثر قبل توفرها وإجراء تحليل مقارن معتمد." />}
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold dark:bg-slate-900">حالة تقييم الأثر: <span className="text-tier-amber">لم يُثبت أثر</span> — يلزم تحليل مقارن قبل/بعد تعتمده وحدة الجودة.</p>
      </section>
      {canEdit && !demo && <section className="card p-5">
        <h2 className="mb-3 text-lg font-extrabold">إدخال بيانات شهرية معتمدة</h2>
        <form className="grid gap-3 sm:grid-cols-5" onSubmit={async e => {
          e.preventDefault(); setMsg('');
          if (form.nonurgent_visits > form.total_visits) { setMsg('الزيارات غير العاجلة لا يمكن أن تتجاوز الإجمالي.'); return; }
          try { await api.saveEd(form); setMsg('تم الحفظ.'); onSaved(); } catch { setMsg('تعذّر الحفظ — تحقق من صلاحية التعديل.'); }
        }}>
          <label className="text-sm font-semibold">الشهر<input type="month" className="field mt-1 text-base" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} required /></label>
          <label className="text-sm font-semibold">إجمالي الزيارات<input type="number" min={0} className="field mt-1 text-base" value={form.total_visits} onChange={e => setForm({ ...form, total_visits: +e.target.value })} required /></label>
          <label className="text-sm font-semibold">غير العاجلة<input type="number" min={0} className="field mt-1 text-base" value={form.nonurgent_visits} onChange={e => setForm({ ...form, nonurgent_visits: +e.target.value })} required /></label>
          <label className="text-sm font-semibold">مصدر البيانات<input className="field mt-1 text-base" placeholder="مثال: تقرير الجودة" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} required /></label>
          <button className="btn-primary self-end">حفظ</button>
        </form>
        {msg && <p className="mt-2 font-semibold" role="status">{msg}</p>}
        <p className="mt-2 text-xs muted">أدخل أرقامًا مجمّعة فقط (لا بيانات مريضات). تعريف «غير العاجلة» يجب أن يكون ثابتًا ومعتمدًا من قسم الطوارئ (مثل مستويات الفرز 4–5).</p>
      </section>}
    </>
  );
}

function Governance({ api }: { api: AdminApi }) {
  const { demo, canEdit } = useSource();
  const [gerr, setGerr] = useState('');
  const [list, setList] = useState<Approval[]>([]);
  const [f, setF] = useState({ reviewer: '', notes: '', decision: 'approved' as Approval['decision'] });
  const load = () => api.approvals().then(setList).catch(() => {});
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const approvedThis = list.some(a => a.content_version === contentMeta.version && a.decision === 'approved');
  return (
    <>
      <section className="card p-5">
        <h2 className="text-lg font-extrabold">حالة المحتوى المنشور</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[15px]">
          <dt className="font-bold">الإصدار</dt><dd className="tabular"><bdi dir="ltr">{contentMeta.version}</bdi></dd>
          <dt className="font-bold">الحالة في الكود</dt><dd>{statusLabel[contentMeta.status]}</dd>
          <dt className="font-bold">آخر مراجعة طبية</dt><dd>{contentMeta.lastClinicalReview ?? 'لم تتم بعد'}</dd>
          <dt className="font-bold">سجل الاعتماد</dt><dd>{approvedThis ? 'يوجد اعتماد مسجّل لهذا الإصدار' : 'لا يوجد اعتماد مسجّل لهذا الإصدار'}</dd>
        </dl>
        {!approvedThis && <p className="mt-3 rounded-xl bg-urgent-50 p-3 font-bold text-urgent-700 dark:bg-urgent-900/30 dark:text-urgent-100">لا تُستخدم المنصة مع المريضات قبل اعتماد هذا الإصدار من الفريق الطبي.</p>}
        <p className="mt-3 text-sm muted">سير العمل: أي تعديل طبي يتم في ملفات المحتوى (src/content) برقم إصدار جديد ← مراجعة الفريق الطبي وفق docs/CLINICAL_REVIEW.md ← تسجيل القرار هنا ← تحديث الحالة وتاريخ المراجعة في الكود ← النشر.</p>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 text-lg font-extrabold">سجل قرارات المراجعة الطبية</h2>
        {canEdit && !demo ? <>
        <p className="mb-3 text-sm muted">تسجيل قرار هنا لا يغيّر حالة المحتوى المنشور تلقائيًا. الحالة تبقى «مسودة» حتى يُحدَّث ملف الإصدار في الكود بعد الاعتماد الموقّع.</p>
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]" onSubmit={async e => {
          e.preventDefault();
          setGerr('');
          try {
            await api.addApproval({ content_version: contentMeta.version, decision: f.decision, reviewer: f.reviewer.trim(), notes: f.notes.trim(), reviewed_at: new Date().toISOString().slice(0, 10) });
            setF({ reviewer: '', notes: '', decision: 'approved' }); load();
          } catch { setGerr('تعذّر التسجيل — تحقق من صلاحيتك.'); }
        }}>
          <input className="field text-base" placeholder="اسم المراجع ومسماه" value={f.reviewer} onChange={e => setF({ ...f, reviewer: e.target.value })} required />
          <input className="field text-base" placeholder="ملاحظات" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
          <select className="field text-base" value={f.decision} onChange={e => setF({ ...f, decision: e.target.value as Approval['decision'] })}>
            <option value="approved">معتمد</option><option value="changes_requested">يحتاج تعديلات</option>
          </select>
          <button className="btn-primary">تسجيل</button>
        </form>
        {gerr && <p className="mt-2 font-semibold text-urgent-600" role="alert">{gerr}</p>}
        </> : <p className="mb-2 text-sm muted">{demo ? 'العرض التجريبي للقراءة فقط.' : 'حسابك بصلاحية اطلاع فقط؛ تسجيل القرارات لمن لديهم صلاحية تعديل.'}</p>}
        <ul className="mt-4 divide-y divide-slate-100 text-[15px] dark:divide-slate-800">
          {list.map(a => (
            <li key={a.id} className="flex flex-wrap gap-x-4 py-2">
              <span className="font-bold tabular">{a.reviewed_at}</span><span className="tabular">{a.content_version}</span>
              <span className={a.decision === 'approved' ? 'font-bold text-calm-700' : 'font-bold text-tier-amber'}>{a.decision === 'approved' ? 'معتمد' : 'يحتاج تعديلات'}</span>
              <span>{a.reviewer}</span><span className="muted">{a.notes}</span>
            </li>
          ))}
          {!list.length && <li className="py-2 muted">لا توجد قرارات مسجّلة.</li>}
        </ul>
      </section>
    </>
  );
}

function QrPanel() {
  const base = config.publicUrl || `${window.location.origin}${window.location.pathname}`;
  const [loc, setLoc] = useState<string>(qrLocations[0].id);
  const [kiosk, setKiosk] = useState(false);
  const [svg, setSvg] = useState('');
  const url = `${base.replace(/[?#].*$/, '')}?src=${loc}${kiosk ? '&kiosk=1' : ''}`;
  useEffect(() => { import('qrcode').then(Q => Q.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0b2640', light: '#ffffff' } }).then(setSvg)); }, [url]);
  const label = qrLocations.find(l => l.id === loc)!.label;
  const download = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `qr-${loc}.svg`; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-extrabold">إنشاء رمز QR لموقع محدد</h2>
        <p className="text-sm muted">يُضاف لكل رمز وسم مجهول للموقع لمعرفة الأماكن الأكثر استخدامًا. لا يتطلب الدخول للمنصة أي تسجيل.</p>
        <label className="block font-semibold">موقع الملصق
          <select className="field mt-1 text-base" value={loc} onChange={e => setLoc(e.target.value)}>
            {qrLocations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3 font-semibold"><input type="checkbox" className="h-5 w-5 accent-brand-600" checked={kiosk} onChange={e => setKiosk(e.target.checked)} />للشاشات المشتركة (وضع الشاشة العامة: يعود للرئيسية ويمسح الإجابات بعد دقيقتين من عدم الاستخدام)</label>
        <p className="break-all rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800" dir="ltr">{url}</p>
        {!config.publicUrl && <p className="text-sm font-semibold text-tier-amber">حدّد VITE_PUBLIC_URL بعنوان النشر الرسمي قبل طباعة الملصقات.</p>}
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={download} disabled={!svg}><Download className="h-5 w-5" />تحميل SVG للطباعة</button>
          <button className="btn-secondary" onClick={() => window.print()}>طباعة الملصق</button>
        </div>
      </section>
      <section id="qr-poster" className="mx-auto w-[320px] rounded-3xl border-2 border-brand-600 bg-white p-6 text-center text-slate-900">
        <div className="text-2xl font-extrabold text-brand-700">رحلة الحمل الآمن</div>
        <p className="mt-1 text-[15px] font-semibold">استثمري وقت انتظارك في التعرف على صحة حملك</p>
        <div className="mx-auto mt-4 w-56" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-3 text-sm font-bold">امسحي الرمز بكاميرا الجوال · بدون تسجيل</p>
        <p className="mt-3 rounded-xl bg-urgent-50 p-2 text-sm font-bold text-urgent-700">عند أي علامة خطر أبلغي التمريض فورًا · الإسعاف 997</p>
        <p className="mt-2 text-xs text-slate-500">{contentMeta.organization} · {label}</p>
      </section>
      <style>{`@media print { body * { visibility: hidden } #qr-poster, #qr-poster * { visibility: visible } #qr-poster { position: fixed; inset: 0; margin: auto; border: none } }`}</style>
    </div>
  );
}
