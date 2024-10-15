import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';

import { ACCESS_TOKEN_STRATEGY_NAME } from '../constants';
import { getJwtFromHeaders } from '../helpers/jwt';
import { shouldSkipAuth } from '../helpers/skip-auth';
import {} from '@nestjs/core';

@Injectable()
export class AuthenticationGuard extends AuthGuard(ACCESS_TOKEN_STRATEGY_NAME) {
  constructor() {
    super();
  }

  public override async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const accessToken = getJwtFromHeaders(request.headers || {}, 'Bearer');

    if (shouldSkipAuth(context)) {
      if (accessToken) {
        try {
          this.checkUser(context);
        } catch (error) {
          console.log(error);
          throw new UnauthorizedException('Invalid token');
        }
      }

      return true;
    }

    if (!accessToken) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      this.checkUser(context);
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private checkUser(
    context: ExecutionContext,
  ): Promise<boolean> | Observable<boolean> | boolean {
    return super.canActivate(context);
  }
}
