import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CONNECTION_URL: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
