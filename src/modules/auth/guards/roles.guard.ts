import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { FastifyRequest } from 'fastify';
import { User } from 'src/modules/user/domain/user'; // Assuming user entity is imported from domain
import { getJwtFromHeaders } from '../helpers/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ACCESS_TOKEN_STRATEGY_NAME } from '../constants';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { UserRole } from 'src/modules/database/schema/user/user.schema';

export type AuthenticatedRequest = FastifyRequest & { user: User };

@Injectable()
export class RolesGuard
  extends AuthGuard(ACCESS_TOKEN_STRATEGY_NAME)
  implements CanActivate
{
  constructor(private reflector: Reflector) {
    super();
  }

  public override async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const accessToken = getJwtFromHeaders(request.headers || {}, 'Bearer');

    if (!accessToken) {
      throw new UnauthorizedException('Missing token');
    }

    const user = await this.checkUser(request);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Access denied: insufficient role');
    }

    return true;
  }

  private async checkUser(request: AuthenticatedRequest): Promise<User | null> {
    const canActivateResult = await super.canActivate(
      new ExecutionContextHost([request]),
    );
    if (canActivateResult) {
      return request.user as User;
    }
    return null;
  }
}
