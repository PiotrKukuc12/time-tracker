import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { DateUtil, generateULID } from 'src/modules/utils';
import { jobs } from '../job/job.schema';

export const projects = pgTable('projects', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateULID()),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .notNull()
    .$default(() => DateUtil.now),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .$onUpdate(() => DateUtil.now),
});

export const projectRelations = relations(projects, ({ many }) => ({
  jobs: many(jobs),
}));
