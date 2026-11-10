import { MapPin, Smartphone, Phone, ArrowDown } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { services, sehhaty, officialChannels } from '../content/services';
import { tierInfo } from '../content/riskFactors';

const tone = {
  calm: 'bg-calm-50 text-calm-700 dark:bg-calm-900/40 dark:text-calm-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
  amber: 'bg-tier-amberSoft text-tier-amber dark:bg-tier-amberSoftDark dark:text-tier-amberDark',
  urgent: 'bg-urgent-50 text-urgent-600 dark:bg-urgent-900/40 dark:text-urgent-100'
};

export default function WhereToFollow() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="أين أتابع حملي؟"
        lead="دليل مبسّط لدور كل خدمة، ومتى تكون المتابعة فيها مناسبة بصورة عامة. مكان متابعتك الفعلي يحدده الفريق الصحي."
        icon={<MapPin className="h-6 w-6" />}
      />

      <ul className="grid gap-4 md:grid-cols-2">
        {services.map(s => (
          <li key={s.id} className={`card p-5 ${s.id === 'er' ? 'border-urgent-300 dark:border-urgent-900' : ''}`}>
            <div className="flex items-center gap-3">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone[s.tone]}`}><Icon name={s.icon} className="h-6 w-6" /></span>
              <h2 className="text-lg font-extrabold">{s.name}</h2>
            </div>
            <p className="mt-3 text-[16px] font-semibold">{s.role}</p>
            <p className="mt-3 text-sm font-bold muted">تكون مناسبة عادةً لـ:</p>
            <ul className="mt-1 list-disc space-y-1 pe-0 ps-5 text-[15px]">
              {s.usuallyFor.map(u => <li key={u}>{u}</li>)}
            </ul>
          </li>
        ))}
      </ul>

      <section className="card p-5 sm:p-6" aria-labelledby="path">
        <h2 id="path" className="text-xl font-extrabold">مسار الخطورة · أين تكون متابعتك؟</h2>
        <div className="mx-auto mt-4 flex max-w-md flex-col items-stretch gap-2 text-center">
          <div className="rounded-xl bg-brand-600 px-4 py-2.5 font-bold text-white">تقييم الخطورة في كل زيارة</div>
          <ArrowDown className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="rounded-xl border border-slate-200 p-2.5 font-semibold dark:border-slate-700">هل يوجد عامل خطورة <b className="text-urgent-600 dark:text-urgent-100">عالٍ (أحمر)</b>؟</div>
            <div className="grid place-items-center rounded-xl bg-urgent-50 px-3 font-extrabold text-urgent-700 dark:bg-urgent-900/40 dark:text-urgent-100">نعم ← أحمر</div>
          </div>
          <div className="text-sm font-bold muted">لا ↓</div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="rounded-xl border border-slate-200 p-2.5 font-semibold dark:border-slate-700">هل يوجد عامل خطورة <b className="text-tier-amber dark:text-tier-amberDark">متوسط (برتقالي)</b>؟</div>
            <div className="grid place-items-center rounded-xl bg-tier-amberSoft px-3 font-extrabold text-tier-amber dark:bg-tier-amberSoftDark dark:text-tier-amberDark">نعم ← برتقالي</div>
          </div>
          <div className="text-sm font-bold muted">لا ↓</div>
          <div className="rounded-xl bg-calm-50 p-2.5 font-extrabold text-calm-700 dark:bg-calm-900/40 dark:text-calm-300">أخضر ← تستمر متابعتك في المركز الصحي</div>
        </div>
        <div className="mt-6 grid gap-2">
          {(['green', 'amber', 'red'] as const).map(k => (
            <div key={k} className={`flex items-start gap-3 rounded-xl p-3 ${k === 'green' ? 'bg-calm-50 dark:bg-calm-900/30' : k === 'amber' ? 'bg-tier-amberSoft dark:bg-tier-amberSoftDark' : 'bg-urgent-50 dark:bg-urgent-900/30'}`}>
              <span className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${k === 'green' ? 'bg-calm-600' : k === 'amber' ? 'bg-tier-amber' : 'bg-urgent-600'}`} aria-hidden="true" />
              <div><b>{tierInfo[k].title}</b><div className="text-sm muted">{tierInfo[k].place}</div></div>
            </div>
          ))}
          <p className="text-sm muted">عند وجود 3 عوامل متوسطة أو أكثر: {tierInfo.hospitalReview.place}.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><Smartphone className="h-6 w-6 text-brand-600" aria-hidden="true" />{sehhaty.name}</h2>
          <p className="mt-2">{sehhaty.description}</p>
          <ul className="mt-2 list-disc ps-5 text-[15px]">{sehhaty.uses.map(u => <li key={u}>{u}</li>)}</ul>
        </div>
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><Phone className="h-6 w-6 text-brand-600" aria-hidden="true" />وسائل التواصل الرسمية</h2>
          <ul className="mt-2 space-y-1">
            <li><b className="tabular">997</b> — الإسعاف</li>
            <li><b className="tabular">937</b> — وزارة الصحة</li>
            {officialChannels.map(c => <li key={c.label}><b>{c.label}</b> — {c.href ? <a className="underline" href={c.href}>{c.value}</a> : c.value}</li>)}
          </ul>
          {officialChannels.length === 0 && <p className="mt-2 text-sm muted">تُضاف قنوات التواصل الخاصة بالمستشفى هنا بعد اعتمادها رسميًا.</p>}
        </div>
      </section>
    </div>
  );
}
