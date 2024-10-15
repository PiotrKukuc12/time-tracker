import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { ACCESS_TOKEN_STRATEGY_NAME } from '../constants';
import { ApiConfigService } from 'src/modules/config';
import { AccessTokenPayload } from '../ts/types/auth.type';
import { UserService } from 'src/modules/user/services/user.service';
import { User } from 'src/modules/user/domain/user';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  ACCESS_TOKEN_STRATEGY_NAME,
) {
  constructor(
    readonly env: ApiConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.get('JWT_SECRET'),
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
