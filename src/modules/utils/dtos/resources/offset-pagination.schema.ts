import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const offsetPageOptionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1).openapi({
    type: 'integer',
    example: 1,
    minimum: 1,
    description: 'The page number to retrieve',
  }),
  limit: z.coerce.number().int().positive().max(100).default(10).openapi({
    type: 'integer',
    example: 10,
    minimum: 1,
    maximum: 100,
    description: 'The number of items to retrieve per page',
  }),
});

export const offsetPageMetadataSchema = z
  .object({
    itemCount: z.number().int().nonnegative().openapi({
      type: 'integer',
      example: 10,
      minimum: 0,
      description: 'The number of items in the current page',
    }),
    pageCount: z.number().int().nonnegative().openapi({
      type: 'integer',
      example: 1,
      minimum: 0,
      description: 'The total number of pages',
    }),
    nextPage: z
      .number()
      .int()
      .nonnegative()
      .nullable()
      .openapi({
        type: ['integer', 'null'],
        example: 2,
        minimum: 0,
        description: 'The next page number',
      }),
    previousPage: z
      .number()
      .int()
      .nonnegative()
      .nullable()
      .openapi({
        type: ['integer', 'null'],
        example: 1,
        minimum: 0,
        description: 'The previous page number',
      }),
    hasNextPage: z.boolean().openapi({
      type: 'boolean',
      example: true,
      description: 'Whether there is a next page',
    }),
    hasPreviousPage: z.boolean().openapi({
      type: 'boolean',
      example: false,
      description: 'Whether there is a previous page',
    }),
  })
  .merge(offsetPageOptionsSchema);

export type OffsetPageOptionsType = z.infer<typeof offsetPageOptionsSchema>;

export type OffsetPageMetadataType = z.infer<typeof offsetPageMetadataSchema>;
