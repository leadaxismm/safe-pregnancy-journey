import { useEffect, useRef } from 'react';
import { Phone, X, Hospital, Siren } from 'lucide-react';
import { contacts, urgentMessage } from '../content/contacts';

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={e => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="help-title"
      className="m-auto w-[min(560px,calc(100vw-24px))] rounded-3xl border-0 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/60 dark:bg-slate-900 dark:text-slate-100"
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3 bg-urgent-600 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <Siren className="h-8 w-8 shrink-0" aria-hidden="true" />
          <h2 id="help-title" className="text-xl font-extrabold">أحتاج إلى مساعدة طبية الآن</h2>
        </div>
        <button onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-white/15" aria-label="إغلاق">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="space-y-4 p-5">
        <div className="rounded-2xl border-2 border-urgent-500 bg-urgent-50 p-4 dark:bg-urgent-900/40">
          <div className="mb-1 flex items-center gap-2 text-lg font-extrabold text-urgent-700 dark:text-urgent-100">
            <Hospital className="h-6 w-6" aria-hidden="true" /> إذا كنتِ داخل المستشفى
          </div>
          <p className="text-base font-semibold">أبلغي طاقم التمريض أو الفرز فورًا. لا تنتظري دورك ولا تُكملي أي استبيان.</p>
        </div>
        <div>
          <p className="mb-2 text-lg font-extrabold">إذا كنتِ خارج المستشفى، اتصلي:</p>
          <div className="grid grid-cols-2 gap-3">
            {contacts.map(c => (
              <a
                key={c.number}
                href={`tel:${c.number}`}
                className={`flex flex-col items-center rounded-2xl border-2 p-3 transition-colors ${c.primary ? 'border-urgent-600 bg-urgent-600 text-white hover:bg-urgent-700' : 'border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}
              >
                <span className="flex items-center gap-2 text-3xl font-extrabold tabular tracking-wider"><Phone className="h-6 w-6" aria-hidden="true" />{c.number}</span>
                <span className="text-sm font-bold">{c.label}</span>
              </a>
            ))}
          </div>
        </div>
        <p className="text-sm muted">{urgentMessage}</p>
        <button onClick={onClose} className="btn-secondary w-full">رجوع</button>
      </div>
    </dialog>
  );
}
