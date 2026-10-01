import { Lightbulb } from 'lucide-react'
import type { LessonBlock } from '@/types'
import { CodeBlock } from './CodeBlock'
import { FlowDiagram } from './FlowDiagram'

/** Renderiza los bloques de una lección. Los títulos llevan id para el índice lateral. */
export function LessonContent({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'p':
            return <p key={i}>{b.text}</p>
          case 'h':
            return <h2 key={i} id={b.id} className="t-h2 prose__h">{b.text}</h2>
          case 'code':
            return <CodeBlock key={i} code={b.code} caption={b.caption} />
          case 'list':
            return <ul key={i} className="prose__list">{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>
          case 'flow':
            return <FlowDiagram key={i} steps={b.steps} caption={b.caption} />
          case 'callout':
            return (
              <aside key={i} className="callout">
                <Lightbulb size={18} aria-hidden className="callout__icon" />
                <div>
                  <p className="callout__title">{b.title}</p>
                  <p>{b.text}</p>
                </div>
              </aside>
            )
        }
      })}
    </div>
  )
}

export function lessonHeadings(blocks: LessonBlock[]) {
  return blocks.filter((b): b is Extract<LessonBlock, { type: 'h' }> => b.type === 'h').map((b) => ({ id: b.id, text: b.text }))
}
