import { OffsetPageMetaDto } from './offset-page-meta.dto';

type PageDtoMetadata = OffsetPageMetaDto;

export class PageDto<T, TMeta extends PageDtoMetadata = OffsetPageMetaDto> {
  public readonly data: T[];
  public readonly meta: TMeta;

  constructor(data: T[], meta: TMeta) {
    this.data = data;
    this.meta = meta;
  }

  public toMapped<U>(mapFn: (data: T) => U): PageDto<U, TMeta> {
    return new PageDto<U, TMeta>(this.data.map(mapFn), this.meta);
  }

  public isOffsetPageMeta(): this is { meta: OffsetPageMetaDto } {
    return (
      (this.meta as OffsetPageMetaDto).page !== undefined &&
      (this.meta as OffsetPageMetaDto).limit !== undefined &&
      (this.meta as OffsetPageMetaDto).pageCount !== undefined
    );
  }
}
