import { Crosshair, BookOpen, Flag, GitBranch, Mountain, Milestone, Repeat, Footprints, Workflow, RefreshCw, Lock, type LucideIcon } from 'lucide-react'
import type { BadgeView } from '@/types'
import { ProgressBar } from '@/components/ui/Progress'
import { shortDate, cx } from '@/utils/format'

const icons: Record<string, LucideIcon> = {
  'primer-paso': Footprints,
  constante: Repeat,
  algoritmo: Workflow,
  'a-la-primera': Crosshair,
  lector: BookOpen,
  persistente: Mountain,
  'mitad-del-camino': Milestone,
  decisiones: GitBranch,
  bucle: RefreshCw,
  'ruta-completa': Flag,
}

export function BadgeIcon({ id, earned, size = 22 }: { id: string; earned: boolean; size?: number }) {
  const Icon = earned ? (icons[id] ?? Flag) : Lock
  return (
    <span className={cx('plaque', earned ? 'plaque--earned' : 'plaque--locked')} aria-hidden>
      <Icon size={size} strokeWidth={1.75} />
    </span>
  )
}

/** Insignia como elemento de progreso: placa sobria, condición y avance hacia desbloquearla. */
export function Achievement({ badge, fresh }: { badge: BadgeView; fresh?: boolean }) {
  const earned = !!badge.earnedAt
  return (
    <li className={cx('ach', earned ? 'ach--earned' : 'ach--locked', fresh && 'ach--fresh')}>
      <BadgeIcon id={badge.id} earned={earned} />
      <div className="ach__body">
        <p className="ach__name">
          {badge.name}
          <span className="sr-only">{earned ? ' (obtenida)' : ' (bloqueada)'}</span>
        </p>
        <p className="ach__cond">{badge.condition}</p>
        {earned ? (
          <p className="t-caption">Obtenida el {shortDate(badge.earnedAt!)}</p>
        ) : (
          <div className="ach__progress">
            <ProgressBar value={(badge.current / badge.target) * 100} label={`Progreso hacia ${badge.name}`} size="sm" tone="ink" />
            <span className="t-caption num">{badge.current}/{badge.target}</span>
          </div>
        )}
      </div>
    </li>
  )
}
