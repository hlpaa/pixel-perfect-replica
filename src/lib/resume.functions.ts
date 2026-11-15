import { createServerFn } from '@tanstack/react-start';
import { getRequest, setResponseHeader } from '@tanstack/react-start/server';
import { inputSchema } from './resume';

export const analyzeResume = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store');
    const { runAnalysis } = await import('./resume.server');
    return runAnalysis(data, getRequest());
  });