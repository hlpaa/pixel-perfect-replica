import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState, useRef } from 'react';
import { FileText, BriefcaseBusiness, Sparkles, ArrowRight, ShieldCheck, ChartNoAxesCombined, Check, Copy, Download, LoaderCircle, CircleCheck, CirclePlus, Info, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeResume } from '@/lib/resume.functions';
import type { Analysis } from '@/lib/resume';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'ATS Resume Matcher — Análise de currículo' },
    { name: 'description', content: 'Compare seu currículo com uma vaga e prepare uma versão otimizada, preservando suas experiências reais.' },
    { property: 'og:title', content: 'ATS Resume Matcher — Análise de currículo' },
    { property: 'og:description', content: 'Encontre competências em comum, identifique oportunidades de melhoria e prepare seu currículo.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

function Index() {
  const [job, setJob] = useState('');
  const [resume, setResume] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const [optimized, setOptimized] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const analyze = useServerFn(analyzeResume);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setResult(null); setCopied(false);
    try {
      const response = await analyze({ data: { job, resume } });
      if (!response.ok) { setError(response.error); return; }
      setResult(response.analysis); setOptimized(response.analysis.optimized);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }));
    } catch { setError('Não foi possível analisar o currículo. Seus textos foram preservados.'); }
    finally { setBusy(false); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(optimized); setCopied(true); }
    catch { setError('Não foi possível copiar. Selecione o texto do currículo e copie manualmente.'); }
  }
  async function exportPdf() {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11);
      const lines: string[] = pdf.splitTextToSize(optimized, 170);
      let y = 22;
      for (const line of lines) {
        if (y > 275) { pdf.addPage(); y = 22; }
        pdf.text(line, 20, y); y += 5.5;
      }
      pdf.save('curriculo-otimizado.pdf');
    } catch { setError('Não foi possível exportar o PDF. Tente novamente.'); }
    finally { setExporting(false); }
  }

  return <div className="min-h-screen bg-background">
    <header className="app-header"><div className="mx-auto flex h-full max-w-[1120px] items-center justify-between px-5 sm:px-8">
      <div className="flex items-center gap-3"><span className="brand-mark"><FileText size={22} strokeWidth={1.7} /></span><span className="text-[17px] font-semibold">ATS <span className="font-normal text-muted-foreground">Resume Matcher</span></span></div>
      <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Sparkles size={14} className="text-primary" /> Feito para sua próxima oportunidade</span>
    </div></header>
    <main className="workspace">
      <div className="mb-4 flex items-center gap-2 text-xs font-medium text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> SUA PRÓXIMA OPORTUNIDADE COMEÇA AQUI</div>
      <h1 className="intro-title">Seu currículo. <span className="text-primary">A vaga certa.</span></h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">Descubra o que conecta sua experiência à vaga e valorize o que você já sabe fazer.</p>
      <div className="step-track" aria-label="Etapas da análise">
        {['Vaga e currículo', 'Análise de compatibilidade', 'Currículo otimizado'].map((label, i) => <div key={label} className="contents">{i > 0 && <span className="step-line" />}<div className={`flex items-center gap-2 ${i === 0 || result ? 'text-foreground' : 'text-muted-foreground'}`}><span className={`step-number ${i === 0 || result ? 'active' : ''}`}>{result && i < 2 ? <Check size={12} /> : i + 1}</span><span>{label}</span></div></div>)}
      </div>
      <form onSubmit={submit}>
        <div className="grid gap-5 md:grid-cols-2">
          {[{ id: 'job', label: 'Descrição da vaga', sub: 'A oportunidade que você quer conquistar', icon: BriefcaseBusiness, value: job, setter: setJob, placeholder: 'Cole aqui a descrição completa da vaga…\n\nInclua os requisitos, as responsabilidades e as competências que a empresa procura.', note: 'Requisitos, responsabilidades e competências' }, { id: 'resume', label: 'Seu currículo', sub: 'Sua experiência é o ponto de partida', icon: FileText, value: resume, setter: setResume, placeholder: 'Cole aqui o conteúdo do seu currículo…\n\nInclua suas experiências profissionais, formação, habilidades e qualificações.', note: 'Experiências, formação e habilidades' }].map(field => <div className="input-panel" key={field.id}>
            <div className="panel-top"><span className="panel-icon"><field.icon size={19} strokeWidth={1.7} /></span><div><label htmlFor={field.id} className="block text-sm font-semibold">{field.label}</label><p className="mt-1 text-xs text-muted-foreground">{field.sub}</p></div></div>
            <Textarea id={field.id} required maxLength={40000} value={field.value} onChange={e => { field.setter(e.target.value); setResult(null); }} disabled={busy} placeholder={field.placeholder} className="source-input" />
            <div className="panel-bottom"><span>{field.note}</span><span>{field.value.length.toLocaleString('pt-BR')} caracteres</span></div>
          </div>)}
        </div>
        <div className="my-6 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground"><ShieldCheck size={17} className="shrink-0 text-success" /><span>Suas experiências reais. Nenhuma informação inventada.</span></div>
          <Button type="submit" disabled={!job.trim() || !resume.trim() || busy} className="analyze-button">{busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />}{busy ? 'Analisando currículo…' : 'Analisar currículo'}{!busy && <ArrowRight />}</Button>
        </div>
      </form>
      {error && <div role="alert" className="mb-6 rounded-md border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      <section ref={resultRef} className="scroll-mt-6 border-t border-border pt-7" aria-live="polite" aria-busy={busy}>
        <div className="mb-5 flex items-center gap-2.5"><ChartNoAxesCombined size={19} className="text-muted-foreground" /><h2 className="text-base font-semibold">Sua análise</h2>{result && <span className="ml-auto flex items-center gap-1.5 text-xs text-success"><CircleCheck size={14} />Concluída</span>}</div>
        {!result ? <div className="result-empty"><span className="empty-icon">{busy ? <LoaderCircle size={22} className="animate-spin text-primary" /> : <ChartNoAxesCombined size={22} strokeWidth={1.5} />}</span><p className="text-sm font-medium">{busy ? 'Comparando sua experiência com a vaga' : 'Um novo olhar para o seu currículo'}</p><p className="mt-2 px-5 text-center text-xs text-muted-foreground">{busy ? 'A análise pode levar alguns instantes.' : 'Sua compatibilidade e oportunidades de melhoria aparecerão aqui.'}</p></div> : <div className="results">
          <div className="grid gap-8 border-b border-border pb-7 md:grid-cols-[240px_1fr]">
            <div><p className="text-sm font-medium">Compatibilidade estimada</p><div className="score-number mt-3">{result.score}<span className="text-3xl">%</span></div><p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Info size={14} className="mt-0.5 shrink-0" />Uma estimativa de compatibilidade, não uma pontuação real de um sistema ATS.</p></div>
            <div className="space-y-6"><div><h3 className="mb-3 flex items-center gap-2 text-sm font-medium"><CircleCheck size={16} className="text-success" />Palavras-chave encontradas <span className="text-muted-foreground">({result.found.length})</span></h3><div className="flex flex-wrap gap-2">{result.found.map(k => <span key={k} className="keyword found"><Check size={12} />{k}</span>)}{!result.found.length && <p className="text-xs text-muted-foreground">Nenhuma competência comprovada identificada.</p>}</div></div>
            <div><h3 className="mb-3 flex items-center gap-2 text-sm font-medium"><CirclePlus size={16} className="text-warning" />Palavras-chave ausentes <span className="text-muted-foreground">({result.missing.length})</span></h3><div className="flex flex-wrap gap-2">{result.missing.map(k => <span key={k} className="keyword missing">{k}</span>)}{!result.missing.length && <p className="text-xs text-muted-foreground">Nenhuma competência ausente identificada.</p>}</div><p className="mt-3 text-xs text-muted-foreground">Oportunidades de desenvolvimento — não adicionadas como experiência.</p></div></div>
          </div>
          <div className="py-7"><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-primary" />Sugestões de melhoria</h3><ul className="space-y-3">{result.suggestions.map((s, i) => <li key={i} className="flex gap-3 text-sm leading-relaxed"><span className="step-number shrink-0">{i + 1}</span><span>{s}</span></li>)}</ul></div>
          <div className="border-t border-border pt-7"><div className="mb-4 flex flex-wrap items-center justify-between gap-4"><h2 className="flex items-center gap-2 text-base font-semibold"><PencilLine size={18} className="text-primary" />Currículo otimizado</h2><div className="flex gap-2"><Button variant="outline" onClick={copy} disabled={!optimized.trim()}>{copied ? <Check /> : <Copy />}{copied ? 'Copiado' : 'Copiar'}</Button><Button onClick={exportPdf} disabled={exporting || !optimized.trim()}>{exporting ? <LoaderCircle className="animate-spin" /> : <Download />}Exportar PDF</Button></div></div><Textarea aria-label="Currículo otimizado" className="resume-editor" value={optimized} onChange={e => { setOptimized(e.target.value); setCopied(false); }} /><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={14} />Experiências e qualificações originais preservadas. Revise antes de enviar.</p></div>
        </div>}
      </section>
      <footer className="mt-9 flex flex-col justify-between gap-3 border-t border-border pt-5 text-[11px] text-muted-foreground sm:flex-row"><span>ATS Resume Matcher</span><span>Mais clareza. A mesma trajetória. Novas possibilidades.</span></footer>
    </main>
  </div>;
}
