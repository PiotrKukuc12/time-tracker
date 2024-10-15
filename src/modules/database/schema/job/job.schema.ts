import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { DateUtil, generateULID } from 'src/modules/utils';
import { projects } from '../project/project.schema';
import { relations } from 'drizzle-orm';
import { users } from '../user/user.schema';
export enum JobStatus {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

export const jobStatusEnum = pgEnum('job_status', [
  JobStatus.ACTIVE,
  JobStatus.FINISHED,
]);

export const jobs = pgTable('jobs', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateULID()),
  description: text('description').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  projectId: text('project_id')
    .references(() => projects.id)
    .notNull(),
  status: jobStatusEnum('status').notNull().default(JobStatus.ACTIVE),
  startDate: timestamp('start_date', {
    withTimezone: true,
    mode: 'date',
  })
    .notNull()
    .$default(() => DateUtil.now),
  finishDate: timestamp('finish_date', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const jobRealtions = relations(jobs, ({ one }) => ({
  projects: one(projects, {
    fields: [jobs.projectId],
    references: [projects.id],
  }),
  users: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
}));
