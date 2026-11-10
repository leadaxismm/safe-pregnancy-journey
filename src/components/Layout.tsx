import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Siren, Info } from 'lucide-react';
import { useHelp } from './HelpContext';
import { contentMeta, statusLabel } from '../content/meta';
import { disclaimer } from '../content/contacts';
import { track } from '../lib/analytics';

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('spj-theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);
  return [dark, setDark] as const;
}

/** Kiosk mode (?kiosk=1): after 2 minutes idle, return home and wipe in-memory answers. */
function useKioskReset(onReset: () => void) {
  const navigate = useNavigate();
  const [kiosk] = useState(() => {
    try {
      if (new URLSearchParams(window.location.search).get('kiosk') === '1') sessionStorage.setItem('spj-kiosk', '1');
      return sessionStorage.getItem('spj-kiosk') === '1';
    } catch { return false; }
  });
  useEffect(() => {
    if (!kiosk) return;
    let t: number;
    const arm = () => {
      clearTimeout(t);
      t = window.setTimeout(() => { navigate('/'); onReset(); window.scrollTo(0, 0); }, 120_000);
    };
    const evs = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    evs.forEach(e => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => { clearTimeout(t); evs.forEach(e => window.removeEventListener(e, arm)); };
  }, [kiosk, navigate, onReset]);
  return kiosk;
}

export function Layout({ children, onReset }: { children: ReactNode; onReset: () => void }) {
  const [dark, setDark] = useTheme();
  const { openHelp } = useHelp();
  const loc = useLocation();
  const kiosk = useKioskReset(onReset);

  useEffect(() => {
    window.scrollTo(0, 0);
    const topic = loc.pathname === '/' ? 'home' : loc.pathname.slice(1);
    track('page_view', { topic });
  }, [loc.pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">انتقلي إلى المحتوى</a>

      {contentMeta.status !== 'approved' && (
        <div className="bg-amber-100 px-4 py-1.5 text-center text-sm font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200" role="note">
          نسخة تجريبية للمراجعة فقط · {statusLabel[contentMeta.status]} · ليست للاستخدام مع المريضات
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="رحلة الحمل الآمن — الصفحة الرئيسية">
            <img src="./icon.svg" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-lg font-extrabold text-brand-700 dark:text-brand-300">رحلة الحمل الآمن</div>
              <div className="truncate text-xs font-semibold muted">{contentMeta.organization} · {contentMeta.facility}</div>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <Link to="/about" className="grid h-11 w-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="عن المنصة والخصوصية">
              <Info className="h-5 w-5" />
            </Link>
            <button onClick={() => setDark(d => !d)} className="grid h-11 w-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-6 fade-in" key={loc.pathname}>
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 pb-28 pt-6 text-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl space-y-2 muted">
          <p className="font-bold text-slate-700 dark:text-slate-300">{disclaimer}</p>
          <p>المصدر: {contentMeta.sourceTitle}. إعداد المحتوى الأصلي: {contentMeta.sourcePageAuthor}.</p>
          <p>
            إصدار المحتوى <bdi dir="ltr">{contentMeta.version}</bdi> · آخر مراجعة طبية:{' '}
            {contentMeta.lastClinicalReview ? <span className="tabular">{contentMeta.lastClinicalReview}</span> : 'لم تتم بعد'}
            {kiosk && ' · وضع الشاشة العامة'}
          </p>
        </div>
      </footer>

      {/* Danger signs take priority on every page: persistent help bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-urgent-100 bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-urgent-900 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button onClick={openHelp} className="btn-urgent flex-1 text-lg shadow-lg shadow-urgent-600/20 sm:flex-none sm:px-8">
            <Siren className="h-6 w-6" aria-hidden="true" /> أحتاج إلى مساعدة طبية الآن
          </button>
          <Link to="/symptoms" className="hidden text-sm font-bold text-urgent-700 underline-offset-4 hover:underline sm:block dark:text-urgent-100">
            هل لديكِ علامة خطر؟ تعرّفي عليها
          </Link>
        </div>
      </div>
    </div>
  );
}
