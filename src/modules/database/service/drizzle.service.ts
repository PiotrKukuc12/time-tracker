import { Inject, Injectable } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CONNECTION_POOL } from '../database.module-definition';
import { Pool } from 'pg';
import { dbSchema } from '../schema';

@Injectable()
export class DrizzleService {
  public readonly db: NodePgDatabase<typeof dbSchema>;

  constructor(@Inject(CONNECTION_POOL) private readonly pool: Pool) {
    this.db = drizzle(this.pool, { schema: dbSchema });
  }
}
