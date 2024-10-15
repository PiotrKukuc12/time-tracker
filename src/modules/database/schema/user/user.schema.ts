import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { DateUtil, generateULID } from '../../../utils';
import { relations, sql } from 'drizzle-orm';
import { jobs } from '../job/job.schema';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export const userStatusEnum = pgEnum('user_status', [
  UserStatus.ACTIVE,
  UserStatus.INACTIVE,
]);

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateULID()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  status: userStatusEnum('status').notNull().default(UserStatus.ACTIVE),
  roles: text('roles')
    .array()
    .$type<UserRole[]>()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  verifyToken: text('verify_token'),
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

export const userRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
}));
