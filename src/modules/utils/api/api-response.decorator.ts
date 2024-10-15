import {
  ApiResponse as NestApiResponse,
  type ApiResponseOptions,
} from '@nestjs/swagger';
import { toOpenAPI, ToOpenApiInput } from './to-open-api';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { applyDecorators } from '@nestjs/common';

export type ResponseOptions = Pick<
  ApiResponseOptions,
  'content' | 'description' | 'headers' | 'status'
> & {
  readonly schema?: ToOpenApiInput | SchemaObject;
};
export function ApiResponse(
  options: ResponseOptions | ResponseOptions[] = [],
): ClassDecorator & MethodDecorator {
  const responseOptions = Array.isArray(options) ? options : [options];

  const normalizedOptions = responseOptions.map((option) => ({
    ...option,
    schema: option.schema ? toOpenAPI(option.schema) : undefined,
  }));

  return applyDecorators(
    ...normalizedOptions.map((option) => NestApiResponse(option)),
  );
}
