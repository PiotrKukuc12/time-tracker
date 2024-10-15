import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationService } from './auth.service';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/services/user.service';
import { AuthController } from './auth.controller';
import { ACCESS_TOKEN_STRATEGY_NAME } from './constants';

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule.register({
      defaultStrategy: [ACCESS_TOKEN_STRATEGY_NAME],
    }),
    UserModule,
  ],
  providers: [AuthenticationService, UserService],
  controllers: [AuthController],
  exports: [AuthenticationService],
})
export class AuthModule {}
