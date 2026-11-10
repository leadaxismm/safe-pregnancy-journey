import { Link } from 'react-router-dom';
import { Leaf, Clock, MessageCircleQuestion } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { dailyTips } from '../content/learn';

export default function Tips() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="نصائح لحمل صحي وآمن"
        lead="عادات يومية بسيطة لكِ ولطفلك."
        icon={<Leaf className="h-6 w-6" />}
        speakText={'نصائح يومية: ' + dailyTips.map(t => t.text).join('، ')}
      />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {dailyTips.map(t => (
          <li key={t.text} className="card flex items-center gap-4 p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-calm-50 text-calm-700 dark:bg-calm-900/40 dark:text-calm-300"><Icon name={t.icon} /></span>
            <span className="text-[17px] font-bold">{t.text}</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/learn" className="btn-primary"><Clock className="h-5 w-5" aria-hidden="true" />تعلّمي خلال انتظارك</Link>
        <Link to="/learn?tab=faq" className="btn-secondary"><MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />أسئلة شائعة</Link>
      </div>
    </div>
  );
}
