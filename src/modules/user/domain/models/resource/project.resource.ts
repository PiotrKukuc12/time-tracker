import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(50),
});

export type CreateProjectResource = z.infer<typeof createProjectSchema>;
