import { Global, Module } from '@nestjs/common';
import {
  ConfigurableDatabaseModule,
  DATABASE_OPTIONS,
} from './database.module-definition';
import { DrizzleService } from './service/drizzle.service';
import { DatabaseOptions } from './database-options';
import { Pool } from 'pg';

@Global()
@Module({
  providers: [
    DrizzleService,
    {
      provide: 'CONNECTION_POOL',
      inject: [DATABASE_OPTIONS],
      useFactory: (options: DatabaseOptions) => {
        return new Pool({
          connectionString: options.connectionUrl,
        });
      },
    },
  ],
  exports: [DrizzleService],
})
export class DatabaseModule extends ConfigurableDatabaseModule {}
