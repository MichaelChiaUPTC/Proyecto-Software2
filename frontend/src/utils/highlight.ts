export interface Token {
  text: string
  kind: 'kw' | 'str' | 'num' | 'com' | 'fn' | 'bi' | 'op' | 'plain'
}

const KEYWORDS = new Set(['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'and', 'or', 'not', 'True', 'False', 'None', 'pass', 'break', 'continue', 'import', 'from', 'as', 'is'])
const BUILTINS = new Set(['print', 'range', 'len', 'int', 'float', 'str', 'bool', 'type', 'set', 'list', 'max', 'min', 'sum', 'input', 'abs', 'round'])

const RE = /(#[^\n]*)|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_\d])/g

/** Resaltador mínimo para Python y pseudocódigo. Devuelve tokens agrupados por línea. */
export function highlight(code: string): Token[][] {
  const lines: Token[][] = [[]]
  const push = (t: Token) => {
    t.text.split('\n').forEach((p, i) => {
      if (i > 0) lines.push([])
      if (p) lines[lines.length - 1].push({ ...t, text: p })
    })
  }
  let prevWord = ''
  for (const m of code.matchAll(RE)) {
    const [text, com, str, num, word, ws] = m
    if (com) push({ text, kind: 'com' })
    else if (str) push({ text, kind: 'str' })
    else if (num) push({ text, kind: 'num' })
    else if (word) {
      let kind: Token['kind'] = 'plain'
      if (KEYWORDS.has(word)) kind = 'kw'
      else if (prevWord === 'def') kind = 'fn'
      else if (BUILTINS.has(word)) kind = 'bi'
      push({ text, kind })
      prevWord = word
      continue
    } else if (ws) push({ text, kind: 'plain' })
    else push({ text, kind: 'op' })
    if (!ws) prevWord = ''
  }
  return lines
}
