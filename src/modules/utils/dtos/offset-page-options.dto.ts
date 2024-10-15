import { createZodDto } from '@anatine/zod-nestjs';
import { offsetPageOptionsSchema } from './resources/offset-pagination.schema';

export class OffsetPageOptionsDto extends createZodDto(
  offsetPageOptionsSchema,
) {
  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  public static construct({
    limit,
    page,
  }: {
    limit: number;
    page: number;
  }): OffsetPageOptionsDto {
    const dto = new OffsetPageOptionsDto();

    dto.page = page;
    dto.limit = limit;

    return dto;
  }

  public static default(): OffsetPageOptionsDto {
    const dto = new OffsetPageOptionsDto();

    dto.page = 1;
    dto.limit = 10;

    return dto;
  }
}
