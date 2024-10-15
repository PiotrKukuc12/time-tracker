import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { REFRESH_TOKEN_STRATEGY_NAME } from '../constants';
import { ApiConfigService } from '../../config/api-config.service';
import { AccessTokenPayload } from '../ts/types/auth.type';
import { UserService } from 'src/modules/user/services/user.service';
import { User } from 'src/modules/user/domain/user';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  REFRESH_TOKEN_STRATEGY_NAME,
) {
  constructor(
    readonly env: ApiConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.get('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<User> {
    const user = await this.userService.findOne({
      type: 'id',
      value: payload.sub,
    });
    if (!user) {
      throw new UnauthorizedException({
        message: 'User not found',
      });
    }
    return user;
  }
}
