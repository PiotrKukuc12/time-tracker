import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeaders,
  ApiOperation,
  ApiParam,
  type ApiHeaderOptions,
  type ApiOperationOptions,
  type ApiParamOptions,
} from '@nestjs/swagger';
import { ApiResponse, ResponseOptions } from './api-response.decorator';
import { ApiQuery, ApiQueryOptions } from './api-query.decorator';

// TODO - Api Param
interface DescribeApiOptions {
  readonly requiresApiAuth?: boolean;
  readonly response?: ResponseOptions | ResponseOptions[];
  readonly operationOptions?: Omit<
    ApiOperationOptions,
    'requestBody' | 'responses'
  >;
  readonly headers?: ApiHeaderOptions[];
  readonly params?: ApiParamOptions | ApiParamOptions[];
  readonly query?: ApiQueryOptions | ApiQueryOptions[];
}

export function DescribeApi({
  requiresApiAuth = true,
  response = {},
  operationOptions = {},
  headers = [],
  params = [],
  query = [],
}: DescribeApiOptions = {}): ReturnType<typeof applyDecorators> {
  const paramOptions = Array.isArray(params) ? params : [params];

  const extraDecorators = [
    requiresApiAuth ? ApiBearerAuth() : undefined,
  ].filter(Boolean) as Parameters<typeof applyDecorators>;

  return applyDecorators(
    ApiOperation(operationOptions),
    ApiResponse(response),
    ApiHeaders(headers),
    ApiQuery(query),
    ...extraDecorators,
    ...paramOptions.map((paramOption) => ApiParam(paramOption)),
  );
}
