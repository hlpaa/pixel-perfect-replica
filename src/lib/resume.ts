import { z } from 'zod';

export const inputSchema = z.object({ job: z.string().trim().min(1).max(40000), resume: z.string().trim().min(1).max(40000) });
export const analysisSchema = z.object({
  keywords: z.array(z.object({ keyword: z.string(), evidence: z.string().nullable() })),
  suggestions: z.array(z.string()),
  paragraphOrder: z.array(z.number()),
  highlights: z.array(z.string()),
});
export type Analysis = { score: number; found: string[]; missing: string[]; suggestions: string[]; optimized: string };
export const paragraphs = (resume: string) => resume.trim().split(/\n\s*\n/).filter(Boolean);
const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();

export function prepareAnalysis(resume: string, raw: z.infer<typeof analysisSchema>): Analysis {
  const original = paragraphs(resume);
  const found: string[] = [];
  const missing: string[] = [];
  for (const item of raw.keywords) {
    if (!item.keyword.trim() || [...found, ...missing].some(k => normalize(k) === normalize(item.keyword))) continue;
    const supported = item.evidence?.trim() && normalize(resume).includes(normalize(item.evidence));
    (supported ? found : missing).push(item.keyword);
  }
  const order = raw.paragraphOrder;
  const complete = order.length === original.length && new Set(order).size === original.length && order.every(i => Number.isInteger(i) && i >= 0 && i < original.length);
  const body = (complete ? order.map(i => original[i]) : original).join('\n\n');
  // A highlight can only be an exact source excerpt, never newly generated claims.
  const highlights = [...new Set(raw.highlights)].filter(h => h.trim() && resume.includes(h));
  const optimized = highlights.length ? `DESTAQUES PROFISSIONAIS\n${highlights.map(h => `• ${h}`).join('\n')}\n\n${body}` : body;
  const total = found.length + missing.length;
  return { score: total ? Math.round(found.length / total * 100) : 0, found, missing, suggestions: raw.suggestions, optimized };
}