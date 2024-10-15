import {
  OffsetPageMetadataType,
  OffsetPageOptionsType,
} from './resources/offset-pagination.schema';

export type OffsetPageMetaDtoParams = OffsetPageOptionsType & {
  itemCount: number;
};

export class OffsetPageMetaDto implements OffsetPageMetadataType {
  public readonly page: number;
  public readonly limit: number;
  public readonly itemCount: number;
  public readonly pageCount: number;
  public readonly nextPage: number | null;
  public readonly previousPage: number | null;
  public readonly hasNextPage: boolean;
  public readonly hasPreviousPage: boolean;

  constructor({ limit, page, itemCount }: OffsetPageMetaDtoParams) {
    this.page = page;
    this.limit = limit;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(itemCount / limit);
    this.nextPage = page < this.pageCount ? page + 1 : null;
    this.previousPage = page > 1 && page <= this.pageCount ? page - 1 : null;
    this.hasNextPage = this.nextPage !== null;
    this.hasPreviousPage = this.previousPage !== null;
  }

  public static create(params: OffsetPageMetaDtoParams): OffsetPageMetaDto {
    return new OffsetPageMetaDto(params);
  }
}
