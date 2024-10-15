import { applyDecorators } from '@nestjs/common';
import {
  ApiQuery as NestApiQuery,
  type ApiQueryOptions as NestApiQueryOptions,
} from '@nestjs/swagger';
import {
  type ReferenceObject,
  type SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { z } from 'zod';
import { isZodDto, toOpenAPI, ToOpenApiInput } from './to-open-api';

type TypedNestApiQueryOptions = NestApiQueryOptions & {
  items?: SchemaObject | ReferenceObject;
};

export type ApiQueryOptions =
  | (TypedNestApiQueryOptions & {
      schema?: ToOpenApiInput;
    })
  | (TypedNestApiQueryOptions & {
      schema: ToOpenApiInput;
      spreadSchema: true;
    });

export function ApiQuery(
  decoratorOptions: ApiQueryOptions | Array<ApiQueryOptions>,
): ClassDecorator & MethodDecorator {
  const isSchemaSpreadable = (
    option: ApiQueryOptions,
  ): option is { schema: ToOpenApiInput; spread: true } =>
    'spreadSchema' in option &&
    option.spreadSchema === true &&
    (isZodDto(option.schema) || option.schema instanceof z.ZodType);

  const queryOptions = Array.isArray(decoratorOptions)
    ? decoratorOptions
    : [decoratorOptions];

  const decoratorsToApply = queryOptions.map((options) => {
    if (isSchemaSpreadable(options)) {
      const openApiSchema = toOpenAPI(options.schema);

      const spreadedOptions = Object.entries(
        openApiSchema.properties || {},
      ).reduce((acc, [key, value]) => {
        acc.push({
          name: key,
          schema: value,
        });

        return acc;
      }, [] as NestApiQueryOptions[]);

      return spreadedOptions.map((opt) => NestApiQuery(opt));
    }

    return NestApiQuery({
      ...options,
      schema: options.schema ? toOpenAPI(options.schema) : undefined,
    } as NestApiQueryOptions);
  });

  return applyDecorators(...decoratorsToApply.flat(1));
}
