import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { DateUtil, generateULID } from '../../../utils';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
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
