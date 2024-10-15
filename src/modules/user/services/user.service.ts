import { Injectable } from '@nestjs/common';
import { dbSchema, DrizzleService } from 'src/modules/database';
import { User } from '../domain/user';
import { and, eq } from 'drizzle-orm';
import { UserStatus } from 'src/modules/database/schema/user/user.schema';

export type FindOneInput = {
  type: 'id' | 'email';
  value: string;
  query?: {
    status?: UserStatus;
  };
};

@Injectable()
export class UserService {
  constructor(private readonly drizzle: DrizzleService) {}

  public async create(user: User): Promise<void> {
    await this.drizzle.db.insert(dbSchema.users).values(user.toInsert());
  }

  public async findOne({
    type,
    value,
    query,
  }: FindOneInput): Promise<User | null> {
    const whereAttributes = [eq(dbSchema.users[type], value)];

    if (query?.status) {
      whereAttributes.push(eq(dbSchema.users.status, query.status));
    }

    const user = await this.drizzle.db.query.users.findFirst({
      where: and(...whereAttributes),
    });

    return user ? User.toDomain(user) : null;
  }
}
