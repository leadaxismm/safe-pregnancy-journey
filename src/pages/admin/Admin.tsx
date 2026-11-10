import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, FileCheck2, LogOut, QrCode, Activity, TriangleAlert } from 'lucide-react';
import { getAdminApi, type AdminApi, type Stats, type EdRow, type Approval } from '../../lib/adminApi';
import { topicLabels, qrLocations } from '../../content/locations';
import { contentMeta, statusLabel } from '../../content/meta';
import { config } from '../../lib/config';
import { quiz } from '../../content/learn';

type Tab = 'overview' | 'impact' | 'governance' | 'qr';
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const fmt = (n: number | null | undefined, d = 0) => (n === null || n === undefined ? '—' : n.toLocaleString('ar-SA-u-nu-latn', { maximumFractionDigits: d }));

export default function Admin() {
  const [api, setApi] = useState<AdminApi | null>(null);
  const [session, setSession] = useState<{ email: string } | null | undefined>(undefined);
  useEffect(() => { getAdminApi().then(async a => { setApi(a); setSession(await a.getSession()); }); }, []);
  useEffect(() => {
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
    document.title = 'لوحة الإدارة · رحلة الحمل الآمن';
    return () => { m.remove(); document.title = 'رحلة الحمل الآمن | Safe Pregnancy Journey'; };
  }, []);

  if (!api || session === undefined) return <div className="p-10 text-center">جارٍ التحميل…</div>;
  if (!session) return <Login api={api} onIn={async () => setSession(await api.getSession())} />;
  return <Dashboard api={api} email={session.email} onOut={async () => { await api.signOut(); setSession(null); }} />;
}

function Login({ api, onIn }: { api: AdminApi; onIn: () => void }) {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <form className="card w-full max-w-sm space-y-4 p-6" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setErr('');
        try { await api.signIn(email, pw); onIn(); } catch { setErr('تعذّر تسجيل الدخول. تحقّق من البيانات أو من صلاحيتك.'); } finally { setBusy(false); }
      }}>
        <h1 className="text-xl font-extrabold">لوحة الإدارة</h1>
        <p className="text-sm muted">مخصصة لفريق المشروع فقط.</p>
        <label className="block"><span className="mb-1 block font-semibold">البريد الإلكتروني</span><input className="field text-base" dir="ltr" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="block"><span className="mb-1 block font-semibold">كلمة المرور</span><input className="field text-base" dir="ltr" type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} required /></label>
        {err && <p className="font-semibold text-urgent-600">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>دخول</button>
      </form>
    </div>
  );
}

function Dashboard({ api, email, onOut }: { api: AdminApi; email: string; onOut: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [range, setRange] = useState<'month' | '3m' | '6m' | 'year'>('6m');
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
    setErr('');
    api.stats(from, to).then(setStats).catch(() => setErr('تعذّر تحميل الإحصائيات. تأكد من صلاحية حسابك.'));
    api.ed().then(setEd).catch(() => {});
  }, [api, from, to]);

  const exportXlsx = async () => {
    if (!stats) return;
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const summary = [
      ['المؤشر', 'القيمة'],
      ['الفترة', `${from.toISOString().slice(0, 10)} → ${to.toISOString().slice(0, 10)}`],
      ['نوع البيانات', api.mode === 'demo' ? 'بيانات تجريبية' : 'بيانات فعلية مجمّعة'],
      ['عدد الزيارات (المستفيدات)', stats.visits],
      ['مشاهدات الصفحات', stats.pageViews],
      ['استبيانات عوامل الخطورة المكتملة', stats.riskCompleted],
      ['منها بإجابات كاملة', stats.riskCompletedFull],
      ['بدء رحلة التعلّم', stats.learnStarted],
      ['إكمال رحلة التعلّم', stats.learnCompleted],
      ['نسبة إكمال التعلّم %', pct(stats.learnCompleted, stats.learnStarted)],
      [`متوسط الاختبار القبلي (من ${quiz.length})`, stats.preAvg ?? ''],
      [`متوسط الاختبار البعدي (من ${quiz.length})`, stats.postAvg ?? ''],
      ['نسبة معرفة علامات الخطر بعد التثقيف %', stats.dangerKnownPct ?? ''],
      ['متوسط الرضا (من 5)', stats.satisfactionAvg ?? ''],
      ['عدد التقييمات', stats.satisfactionN],
      ['فتح زر «أحتاج إلى مساعدة طبية الآن»', stats.helpOpened]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'الملخص');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.monthly.map(m => ({
      'الشهر': m.month, 'الزيارات': m.visits, 'استبيانات مكتملة': m.riskCompleted, 'بدء التعلّم': m.learnStarted, 'إكمال التعلّم': m.learnCompleted,
      'نسبة الإكمال %': pct(m.learnCompleted, m.learnStarted), 'متوسط قبلي': m.preAvg, 'متوسط بعدي': m.postAvg, 'معرفة علامات الخطر %': m.dangerKnownPct, 'متوسط الرضا': m.satisfactionAvg
    }))), 'تقرير شهري');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.topTopics.map(t => ({ 'الموضوع': topicLabels[t.topic] ?? t.topic, 'المشاهدات': t.views }))), 'الموضوعات');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.sources.map(t => ({ 'مصدر الدخول': topicLabels[t.topic] ?? t.topic, 'الزيارات': t.views }))), 'مواقع رمز QR');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ed.map(e => ({ 'الشهر': e.month, 'إجمالي زيارات الطوارئ': e.total_visits, 'الزيارات غير العاجلة': e.nonurgent_visits, 'النسبة %': pct(e.nonurgent_visits, e.total_visits), 'المصدر': e.source }))), 'الطوارئ');
    wb.Workbook = { Views: [{ RTL: true }] } as any;
    XLSX.writeFile(wb, `safe-pregnancy-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const tabs: [Tab, string, ReactNode][] = [
    ['overview', 'نظرة عامة', <BarChart3 key="a" className="h-5 w-5" />],
    ['impact', 'أثر المبادرة', <Activity key="b" className="h-5 w-5" />],
    ['governance', 'حوكمة المحتوى', <FileCheck2 key="c" className="h-5 w-5" />],
    ['qr', 'رموز QR', <QrCode key="d" className="h-5 w-5" />]
  ];

  return (
    <div className="min-h-dvh">
      {api.mode === 'demo' && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          وضع العرض: الأرقام أدناه بيانات تجريبية للمراجعة فقط. اربط Supabase لعرض البيانات الفعلية.
        </div>
      )}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-lg font-extrabold text-brand-700 dark:text-brand-300">لوحة الإدارة · رحلة الحمل الآمن</div>
            <div className="text-xs muted">إحصائيات مجمّعة ومجهولة الهوية · {email !== 'demo' && <span dir="ltr">{email}</span>}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-ghost min-h-[40px] px-3 text-sm">المنصة</Link>
            {api.mode === 'supabase' && <button onClick={onOut} className="btn-secondary min-h-[40px] px-3 text-sm"><LogOut className="h-4 w-4" />خروج</button>}
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
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900" role="group" aria-label="الفترة">
              {([['month', 'هذا الشهر'], ['3m', '3 أشهر'], ['6m', '6 أشهر'], ['year', 'سنة']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setRange(k)} aria-pressed={range === k} className={`min-h-[40px] rounded-lg px-3 text-sm font-bold ${range === k ? 'bg-white shadow-sm dark:bg-slate-800' : 'muted'}`}>{l}</button>
              ))}
            </div>
            <button onClick={exportXlsx} disabled={!stats} className="btn-primary min-h-[44px] text-sm"><Download className="h-4 w-4" />تصدير التقرير إلى Excel</button>
          </div>
        )}
        {err && <p className="rounded-xl bg-urgent-50 p-3 font-semibold text-urgent-700">{err}</p>}
        {tab === 'overview' && stats && <Overview s={stats} />}
        {tab === 'impact' && stats && <Impact s={stats} ed={ed} api={api} onSaved={() => api.ed().then(setEd)} />}
        {tab === 'governance' && <Governance api={api} />}
        {tab === 'qr' && <QrPanel />}
      </main>
    </div>
  );
}

function Kpi({ label, value, sub, ltr }: { label: string; value: string; sub?: string; ltr?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-sm font-semibold muted">{label}</div>
      <div dir={ltr ? 'ltr' : undefined} className="mt-1 text-right text-3xl font-extrabold tabular text-slate-900 dark:text-white">{value}</div>
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

function Overview({ s }: { s: Stats }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="المستفيدات (زيارات)" value={fmt(s.visits)} sub={`${fmt(s.pageViews)} مشاهدة صفحة`} />
        <Kpi label="استبيانات الخطورة المكتملة" value={fmt(s.riskCompleted)} sub={`${pct(s.riskCompletedFull, s.riskCompleted)}% بإجابات كاملة`} />
        <Kpi label="نسبة إكمال رحلة التعلّم" value={`${pct(s.learnCompleted, s.learnStarted)}%`} sub={`${fmt(s.learnCompleted)} من ${fmt(s.learnStarted)}`} />
        <Kpi label="رضا المستفيدات" value={s.satisfactionAvg ? `${fmt(s.satisfactionAvg, 1)} / 5` : '—'} sub={`${fmt(s.satisfactionN)} تقييم`} ltr />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-extrabold">أكثر الموضوعات مشاهدة</h2>
          <Bars rows={s.topTopics.map(t => ({ label: topicLabels[t.topic] ?? t.topic, value: t.views }))} />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-extrabold">مصدر الدخول (موقع رمز QR)</h2>
          <Bars color="bg-calm-600" rows={s.sources.map(t => ({ label: topicLabels[t.topic] ?? t.topic, value: t.views }))} />
        </section>
        <section className="card p-5">
          <h2 className="mb-1 text-lg font-extrabold">نتائج الاختبارات المعرفية (مجمّعة)</h2>
          <p className="mb-4 text-sm muted">متوسط الدرجة من {quiz.length} · القبلي {fmt(s.preN)} مشاركة · البعدي {fmt(s.postN)} مشاركة</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"><div className="text-sm muted">قبل</div><div className="text-2xl font-extrabold tabular">{fmt(s.preAvg, 2)}</div></div>
            <div className="rounded-xl bg-calm-50 p-3 dark:bg-calm-900/40"><div className="text-sm muted">بعد</div><div className="text-2xl font-extrabold tabular text-calm-700 dark:text-calm-300">{fmt(s.postAvg, 2)}</div></div>
            <div className="rounded-xl bg-brand-50 p-3 dark:bg-brand-950"><div className="text-sm muted">يعرفن علامات الخطر</div><div className="text-2xl font-extrabold tabular">{s.dangerKnownPct !== null ? `${fmt(s.dangerKnownPct, 1)}%` : '—'}</div></div>
          </div>
          <p className="mt-3 text-xs muted">ملاحظة: المشاركات في الاختبارين مجهولة وغير مرتبطة ببعضها، لذا تمثل الأرقام متوسط المجموعة لا تحسّن كل مستفيدة.</p>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-extrabold">توزيع تقييم الرضا</h2>
          <Bars color="bg-brand-400" rows={[5, 4, 3, 2, 1].map(n => ({ label: `${n} ${'★'.repeat(n)}`, value: s.satisfactionDist[n - 1] ?? 0 }))} />
          <p className="mt-4 text-sm muted">فتح زر «أحتاج إلى مساعدة طبية الآن»: <b className="tabular">{fmt(s.helpOpened)}</b> · فتح صفحة الأعراض: <b className="tabular">{fmt(s.symptomOpened)}</b></p>
        </section>
      </div>
      <section className="card overflow-x-auto p-5">
        <h2 className="mb-3 text-lg font-extrabold">التقرير الشهري</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-slate-200 text-start dark:border-slate-800">{['الشهر', 'الزيارات', 'استبيانات', 'بدء التعلّم', 'إكمال', 'قبلي', 'بعدي', 'علامات الخطر', 'الرضا'].map(h => <th key={h} className="py-2 text-start font-bold">{h}</th>)}</tr></thead>
          <tbody className="tabular">
            {s.monthly.map(m => (
              <tr key={m.month} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2 font-bold">{m.month}</td><td>{fmt(m.visits)}</td><td>{fmt(m.riskCompleted)}</td><td>{fmt(m.learnStarted)}</td>
                <td>{pct(m.learnCompleted, m.learnStarted)}%</td><td>{fmt(m.preAvg, 2)}</td><td>{fmt(m.postAvg, 2)}</td>
                <td>{m.dangerKnownPct !== null ? `${fmt(m.dangerKnownPct, 1)}%` : '—'}</td><td>{fmt(m.satisfactionAvg, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function Impact({ s, ed, api, onSaved }: { s: Stats; ed: EdRow[]; api: AdminApi; onSaved: () => void }) {
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
        <Kpi label="2. نسبة إكمال رحلة التثقيف" value={`${pct(s.learnCompleted, s.learnStarted)}%`} />
        <Kpi label="3. متوسط المعرفة قبل ← بعد" value={`${fmt(s.preAvg, 1)} ← ${fmt(s.postAvg, 1)}`} sub={`قبل ← بعد · من ${quiz.length}`} />
        <Kpi label="4. يعرفن علامات الخطر" value={s.dangerKnownPct !== null ? `${fmt(s.dangerKnownPct, 1)}%` : '—'} sub="إجابة صحيحة عن كل أسئلة علامات الخطر" />
        <Kpi label="5. رضا المستفيدات" value={s.satisfactionAvg ? `${fmt(s.satisfactionAvg, 1)} / 5` : '—'} ltr />
        <Kpi label="6. الزيارات غير العاجلة للطوارئ" value={ed.length ? `${pct(ed[ed.length - 1].nonurgent_visits, ed[ed.length - 1].total_visits)}%` : '—'} sub={ed.length ? `آخر شهر مُدخل: ${ed[ed.length - 1].month}` : 'لم تُدخل بيانات بعد'} />
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
        ) : <p className="muted">لا توجد بيانات بعد.</p>}
      </section>
      <section className="card p-5">
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
      </section>
    </>
  );
}

function Governance({ api }: { api: AdminApi }) {
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
        <h2 className="mb-3 text-lg font-extrabold">تسجيل قرار مراجعة للإصدار {contentMeta.version}</h2>
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]" onSubmit={async e => {
          e.preventDefault();
          await api.addApproval({ content_version: contentMeta.version, decision: f.decision, reviewer: f.reviewer, notes: f.notes, reviewed_at: new Date().toISOString().slice(0, 10) }).catch(() => {});
          setF({ reviewer: '', notes: '', decision: 'approved' }); load();
        }}>
          <input className="field text-base" placeholder="اسم المراجع ومسماه" value={f.reviewer} onChange={e => setF({ ...f, reviewer: e.target.value })} required />
          <input className="field text-base" placeholder="ملاحظات" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
          <select className="field text-base" value={f.decision} onChange={e => setF({ ...f, decision: e.target.value as Approval['decision'] })}>
            <option value="approved">معتمد</option><option value="changes_requested">يحتاج تعديلات</option>
          </select>
          <button className="btn-primary">تسجيل</button>
        </form>
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
