import { Award, BookOpenCheck, Check, X } from 'lucide-react'
import type { ActivityItem } from '@/services/api'
import { relativeTime } from '@/utils/format'

/** Actividad reciente. El tipo y el resultado se indican con icono y texto. */
export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="activity">
      {items.map((a) => (
        <li key={a.id} className="activity__item">
          <span className={`activity__icon activity__icon--${a.kind === 'exercise' ? (a.ok ? 'ok' : 'fail') : a.kind}`} aria-hidden>
            {a.kind === 'badge' ? <Award size={14} /> : a.kind === 'lesson' ? <BookOpenCheck size={14} /> : a.ok ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
          </span>
          <div className="activity__text">
            <p className="activity__title">{a.text}</p>
            <p className="t-caption">{a.detail}</p>
          </div>
          <time className="t-caption activity__time" dateTime={a.at}>{relativeTime(a.at)}</time>
        </li>
      ))}
    </ul>
  )
}
