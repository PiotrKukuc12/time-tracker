import {
  type ReferenceObject,
  type SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { type ZodDtoStatic } from '@anatine/zod-nestjs';
import { generateSchema } from '@anatine/zod-openapi';
import { z } from 'zod';

export type ToOpenApiInput =
  | z.ZodType
  | ZodDtoStatic
  | SchemaObject
  | ReferenceObject;

export const isZodDto = (input: unknown): input is ZodDtoStatic =>
  typeof input === 'function' &&
  'zodSchema' in input &&
  input.zodSchema instanceof z.ZodType;

export function toOpenAPI(input: ToOpenApiInput): SchemaObject {
  let schema = input;

  if (isZodDto(input) || input instanceof z.ZodType) {
    schema = (
      isZodDto(input)
        ? generateSchema(input.zodSchema as z.ZodType)
        : generateSchema(input)
    ) as SchemaObject;
  }

  return schema as SchemaObject;
}
