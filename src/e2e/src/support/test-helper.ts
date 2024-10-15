import { Test, type TestingModule } from '@nestjs/testing';

import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { lastValueFrom } from 'rxjs';
import { AppModule } from '../../../app.module';
import { ApiConfigService } from '../../../modules/config';
import { UserService } from '../../../modules/user/services/user.service';
import { User } from '../../..//modules/user/domain/user';
import postgres from 'postgres';
import { AuthenticationService } from '../../../modules/auth';
import { AuthTokens } from '../../..//modules/auth/ts/types/auth.type';
import { INestApplication } from '@nestjs/common';
import { UserStatus } from 'src/modules/database/schema/user/user.schema';

export class TestHelper {
  public static async prepareFixture(): Promise<{
    application: INestApplication;
  }> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const application = moduleFixture.createNestApplication();

    const configService = application.get(ApiConfigService);

    const databaseUrl = configService.get('CONNECTION_URL');

    if (!databaseUrl.includes('@localhost')) {
      throw new Error('You are not connected to local database');
    }

    application.enableShutdownHooks();

    return {
      application,
    };
  }

  public static async createRandomUser(
    userRepository: UserService,
  ): Promise<User> {
    const newUser = await User.connect({
      email: faker.internet.email(),
      password: faker.internet.password(),
      status: UserStatus.ACTIVE,
      verifyToken: null,
    });

    await userRepository.create(newUser);

    return newUser;
  }
  public static async getUserAuthTokens({
    auth,
    user,
  }: {
    user: User;
    auth: AuthenticationService;
  }): Promise<AuthTokens> {
    const tokens = await lastValueFrom(auth.generateTokenPair({ user }));

    return tokens;
  }

  public static async cleanDatabase(): Promise<void> {
    const databaseUrl = process.env['CONNECTION_URL'];
    if (!databaseUrl) {
      throw new Error('POSTGRES_CONNECTION_URL is not defined');
    }
    if (!databaseUrl.includes('@localhost')) {
      throw new Error('You are not connected to a local database');
    }

    const client = postgres(databaseUrl);
    const db = drizzle(client);

    // Fetch all table names
    const tables: postgres.RowList<Record<string, unknown>[]> =
      await db.execute(sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `);

    // Map to get only the table names as strings
    const tableNames = tables.map(
      (row: Record<string, unknown>) => row['tablename'] as string,
    );

    if (tableNames.length > 0) {
      // Truncate all tables
      await db.execute(sql`
        TRUNCATE ${sql.join(
          tableNames.map((name) => sql.identifier(name)),
          sql`, `,
        )} CASCADE
      `);
    }
  }
}
