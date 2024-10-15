import { z } from 'zod';

export const startJobSchema = z.object({
  description: z.string().min(1).max(200),
  projectId: z.string().uuid(),
});

export const finishJobSchema = z.object({
  jobId: z.string().uuid().min(1),
});

export type StartJobResource = z.infer<typeof startJobSchema>;
export type FinishJobResource = z.infer<typeof finishJobSchema>;
