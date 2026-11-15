import { describe, expect, it } from 'vitest';
import { prepareAnalysis } from '../lib/resume';

const resume = 'Ana Silva\nana@example.com\n\nAnalista na Empresa A, 2020–2024.\nUso Excel para relatórios.\n\nGraduação em Administração.';
const raw = { keywords: [{ keyword: 'Excel', evidence: 'Uso Excel para relatórios.' }, { keyword: 'Python', evidence: null }], suggestions: ['Desenvolver Python em estudos futuros.'], paragraphOrder: [0, 2, 1], highlights: ['Uso Excel para relatórios.'] };
describe('Integridade do currículo', () => {
  it('calcula compatibilidade de 0 a 100 com competências comprovadas', () => {
    expect(prepareAnalysis(resume, raw).score).toBe(50);
    expect(prepareAnalysis(resume, { ...raw, keywords: [] }).score).toBe(0);
    expect(prepareAnalysis(resume, { ...raw, keywords: [raw.keywords[0] as typeof raw.keywords[number]] }).score).toBe(100);
  });
  it('preserva integralmente experiências e qualificações originais', () => {
    const result = prepareAnalysis(resume, raw);
    for (const paragraph of resume.split('\n\n')) expect(result.optimized).toContain(paragraph);
  });
  it('nunca incorpora habilidades sem sustentação no currículo', () => {
    const result = prepareAnalysis(resume, { ...raw, highlights: ['Especialista Python com 10 anos de experiência'] });
    expect(result.optimized).not.toContain('Python');
    expect(result.missing).toEqual(['Python']);
  });
  it('não aceita evidências inventadas como competências encontradas', () => {
    const result = prepareAnalysis(resume, { ...raw, keywords: [{ keyword: 'Python', evidence: 'Desenvolvedor Python' }] });
    expect(result.found).toEqual([]);
    expect(result.missing).toEqual(['Python']);
  });
  it('não remove experiências quando a ordem gerada é incompleta', () => {
    expect(prepareAnalysis(resume, { ...raw, paragraphOrder: [0, 0] }).optimized).toContain(resume);
  });
});