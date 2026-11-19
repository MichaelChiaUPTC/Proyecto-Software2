import { construirPrompt, SISTEMA } from '../domain/prompt.js'
import type { ContextoPista, HintProvider } from '../domain/puertos.js'

/** Anthropic Messages API (fetch nativo). */
export class ClaudeHints implements HintProvider {
  constructor(private readonly o: { apiKey: string; model: string; timeoutMs: number; fetchFn?: typeof fetch }) {}

  async hint(c: ContextoPista): Promise<string> {
    const res = await (this.o.fetchFn ?? fetch)('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.o.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: this.o.model,
        max_tokens: 300,
        system: SISTEMA,
        messages: [{ role: 'user', content: construirPrompt(c) }],
      }),
      signal: AbortSignal.timeout(this.o.timeoutMs),
    })
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`)
    const j = (await res.json()) as { content?: { type: string; text?: string }[] }
    return (j.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('').trim()
  }
}
