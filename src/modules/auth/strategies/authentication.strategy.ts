import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { ACCESS_TOKEN_STRATEGY_NAME } from '../constants';
import { ApiConfigService } from 'src/modules/config';
import { AccessTokenPayload } from '../ts/types/auth.type';
import { UserService } from 'src/modules/user/services/user.service';
import { getJwtFromHeaders } from '../helpers/jwt';
import { AuthenticatedRequest } from '../guards/roles.guard';
import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from '../models/authenticated-user';

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
      passReqToCallback: true,
      algorithms: ['HS256'],
    });
  }

  public validate(
    req: FastifyRequest,
    payload: AccessTokenPayload,
  ): AuthenticatedUser {
    const accessToken = getJwtFromHeaders(req.headers || {});

    if (!accessToken) {
      throw new UnauthorizedException({
        message: 'User not found',
      });
    }

    return new AuthenticatedUser({
      accessToken,
      sub: payload.sub,
      roles: payload.roles,
    });
  }
}
