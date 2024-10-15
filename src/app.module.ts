import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './modules/config/config';
import { ApiConfigModule } from './modules/config/api-config.module';
import { ApiConfigService } from './modules/config/api-config.service';
import { DatabaseOptions } from './modules/database/database-options';
import { AuthModule } from './modules/auth/index';
import { UserModule } from './modules/user/user.module';

const APP_MODULES = [UserModule];

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    ApiConfigModule,
    DatabaseModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      useFactory: (configService: ApiConfigService): DatabaseOptions => ({
        connectionUrl: configService.get('CONNECTION_URL'),
      }),
    }),
    AuthModule,
    ...APP_MODULES,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
