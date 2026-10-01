import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { QueryView } from '@/components/layout/QueryView'
import { Avatar, Badge, Button, DataTable, Input, ProgressBar, Select, useToast, type Column } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { api } from '@/services/api'
import type { StudentRow } from '@/types'
import { daysSince, relativeTime } from '@/utils/format'

const needsAttention = (r: StudentRow) => daysSince(r.lastActivity) >= 7 || r.successRate < 40

function toCsv(rows: StudentRow[]): string {
  const head = ['Estudiante', 'Correo', 'Grupo', 'Progreso (%)', 'Ejercicios resueltos', 'Total ejercicios', 'Éxito (%)', 'Última actividad']
  const body = rows.map((r) => [r.name, r.email, r.group, r.progress, r.solved, r.totalExercises, r.successRate, r.lastActivity])
  return [head, ...body].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export default function ReportsPage() {
  useDocumentTitle('Reportes')
  const q = useQuery(() => api.teacher.reports())
  const toast = useToast()
  const [text, setText] = useState('')
  const [group, setGroup] = useState('all')
  const [state, setState] = useState('all')

  const rows = useMemo(() => {
    const t = text.trim().toLowerCase()
    return (q.data ?? []).filter((r) =>
      (group === 'all' || r.group === group) &&
      (state === 'all' || (state === 'attention' ? needsAttention(r) : !needsAttention(r))) &&
      (!t || r.name.toLowerCase().includes(t) || r.email.toLowerCase().includes(t)),
    )
  }, [q.data, text, group, state])

  const columns: Column<StudentRow>[] = [
    {
      key: 'name', header: 'Estudiante', sortValue: (r) => r.name,
      render: (r) => (
        <span className="who">
          <Avatar name={r.name} size="sm" />
          <span><span className="who__name">{r.name}</span><span className="t-caption who__mail">{r.group}</span></span>
        </span>
      ),
    },
    { key: 'progress', header: 'Progreso', sortValue: (r) => r.progress, width: '22%', render: (r) => <span className="pcell"><ProgressBar value={r.progress} label={`Progreso de ${r.name}`} size="sm" tone="ink" /><span className="num">{r.progress}%</span></span> },
    { key: 'solved', header: 'Ejercicios resueltos', align: 'end', sortValue: (r) => r.solved, render: (r) => <span className="num">{r.solved} <span className="muted">/ {r.totalExercises}</span></span> },
    { key: 'rate', header: 'Éxito', align: 'end', sortValue: (r) => r.successRate, render: (r) => <span className="num">{r.successRate}%</span> },
    { key: 'last', header: 'Última actividad', sortValue: (r) => r.lastActivity, render: (r) => <span className="muted">{relativeTime(r.lastActivity)}</span> },
    { key: 'state', header: 'Estado', render: (r) => (needsAttention(r) ? <Badge tone="err">Requiere atención</Badge> : <Badge tone="ok">Al día</Badge>) },
  ]

  const exportCsv = () => {
    const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'reporte-avance.csv'
    a.click()
    URL.revokeObjectURL(a.href)
    toast.show({ tone: 'success', title: 'Reporte exportado', text: `${rows.length} estudiantes` })
  }

  return (
    <>
      <PageHeader title="Reportes de avance" description="Progreso por estudiante y por grupo. Ordena por cualquier columna." actions={<Button variant="secondary" iconLeft={<Download size={16} aria-hidden />} onClick={exportCsv} disabled={!rows.length}>Exportar CSV</Button>} />
      <QueryView query={q} rows={4}>
        {(all) => (
          <>
            <div className="filters" role="search">
              <Input label="Buscar estudiante" hideLabel type="search" leading={<Search size={16} />} placeholder="Buscar por nombre o correo" value={text} onChange={(e) => setText(e.target.value)} />
              <Select label="Grupo" value={group} onChange={(e) => setGroup(e.target.value)}>
                <option value="all">Todos los grupos</option>
                {[...new Set(all.map((r) => r.group))].sort().map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
              <Select label="Estado" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="all">Todos</option>
                <option value="attention">Requieren atención</option>
                <option value="ok">Al día</option>
              </Select>
            </div>
            <p className="t-caption" aria-live="polite">{rows.length} de {all.length} estudiantes</p>
            <DataTable caption="Avance por estudiante" columns={columns} rows={rows} rowKey={(r) => r.id} initialSort={{ key: 'last', dir: 'asc' }} empty={{ title: 'Ningún estudiante coincide', text: 'Prueba con otro nombre o limpia los filtros.' }} />
          </>
        )}
      </QueryView>
    </>
  )
}
