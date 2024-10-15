import { applyDecorators } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';

export function ApiBearerAuth(): ClassDecorator & MethodDecorator {
  return applyDecorators(ApiSecurity('Bearer'));
}
