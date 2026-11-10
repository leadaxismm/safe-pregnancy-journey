import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { SpeakButton } from './SpeakButton';

export function PageHeader({ title, lead, icon, speakText }: { title: string; lead?: string; icon?: ReactNode; speakText?: string }) {
  return (
    <div className="mb-6">
      <Link to="/" className="btn-ghost -ms-3 mb-2 px-3 text-base">
        <ArrowRight className="h-5 w-5" aria-hidden="true" /> الصفحة الرئيسية
      </Link>
      <div className="flex items-start gap-3">
        {icon && <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">{icon}</div>}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl dark:text-white">{title}</h1>
          {lead && <p className="mt-1 text-base muted sm:text-lg">{lead}</p>}
          {speakText && <SpeakButton text={speakText} className="mt-3" />}
        </div>
      </div>
    </div>
  );
}
