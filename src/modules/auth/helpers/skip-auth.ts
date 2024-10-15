import { ExecutionContext, type Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SKIP_AUTH_METADATA_KEY } from '../constants';

export class AuthMetadataAccessor {
  private static instance: AuthMetadataAccessor;

  private readonly reflector: Reflector = new Reflector();

  private constructor() {}

  public static getInstance(): AuthMetadataAccessor {
    if (!AuthMetadataAccessor.instance) {
      AuthMetadataAccessor.instance = new AuthMetadataAccessor();
    }

    return AuthMetadataAccessor.instance;
  }

  public shouldSkipAuth({
    controller,
    handler,
  }: {
    controller: Type;
    handler: any;
  }): boolean {
    const [controllerMeta, handlerMeta] = this.reflector.getAll<boolean[]>(
      SKIP_AUTH_METADATA_KEY,
      [controller, handler],
    ) as [boolean | undefined, boolean | undefined];

    if (!controllerMeta && handlerMeta !== undefined) {
      return handlerMeta;
    }

    return controllerMeta || handlerMeta || false;
  }
}

export function shouldSkipAuth(context: ExecutionContext): boolean {
  const metadataAccessor = AuthMetadataAccessor.getInstance();

  return metadataAccessor.shouldSkipAuth({
    controller: context.getClass(),
    handler: context.getHandler(),
  });
}
