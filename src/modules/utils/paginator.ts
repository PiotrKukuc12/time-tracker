import { BadRequestException } from '@nestjs/common';
import {
  OffsetPageMetaDto,
  OffsetPageMetaDtoParams,
} from './dtos/offset-page-meta.dto';
import { PageDto } from './dtos/page.dto';

type CreatePageOptions<T> = OffsetPageMetaDtoParams & {
  data: T[];
};

export class Paginator {
  private constructor() {}

  public static createOffsetPage<T>(options: CreatePageOptions<T>): PageDto<T>;
  public static createOffsetPage<T>(
    data: T[],
    meta: OffsetPageMetaDto,
  ): PageDto<T>;
  public static createOffsetPage<T>(
    dataOrOptions: CreatePageOptions<T> | T[],
    meta?: OffsetPageMetaDto,
  ): PageDto<T> {
    if (Array.isArray(dataOrOptions)) {
      if (!meta) {
        throw new BadRequestException(
          'Meta is required when passing data as an array',
        );
      }

      return new PageDto<T>(dataOrOptions, meta);
    }

    const { data, ...metaOptions } = dataOrOptions;

    return new PageDto<T>(data, this.createOffsetPageMeta(metaOptions));
  }

  public static createOffsetPageMeta(
    params: OffsetPageMetaDtoParams,
  ): OffsetPageMetaDto {
    return new OffsetPageMetaDto(params);
  }
}
