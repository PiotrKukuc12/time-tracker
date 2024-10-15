import { ExecutionContext, Injectable } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { AuthGuard } from '@nestjs/passport';

import { FastifyRequest } from 'fastify';

import { REFRESH_TOKEN_STRATEGY_NAME } from '../constants';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard(
  REFRESH_TOKEN_STRATEGY_NAME,
) {
  public override async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<FastifyRequest>();

      super.canActivate(new ExecutionContextHost([request]));

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
