import { construirPrompt, SISTEMA } from '../domain/prompt.js'
import type { ContextoPista, HintProvider } from '../domain/puertos.js'

/** Google AI Studio, REST `generateContent` (fetch nativo). */
export class GeminiHints implements HintProvider {
  constructor(private readonly o: { apiKey: string; model: string; timeoutMs: number; fetchFn?: typeof fetch }) {}

  async hint(c: ContextoPista): Promise<string> {
    const res = await (this.o.fetchFn ?? fetch)(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.o.model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.o.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SISTEMA }] },
          contents: [{ role: 'user', parts: [{ text: construirPrompt(c) }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.4 },
        }),
        signal: AbortSignal.timeout(this.o.timeoutMs),
      },
    )
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
    const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim()
  }
}
