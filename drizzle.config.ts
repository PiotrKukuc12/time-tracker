import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/modules/database/schema/**/*.schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  breakpoints: true,
  strict: true,
  dbCredentials: {
    url: process.env['CONNECTION_URL'] as string,
  },
});
