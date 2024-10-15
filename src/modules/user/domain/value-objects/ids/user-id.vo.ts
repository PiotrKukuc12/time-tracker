import { ULID } from 'src/modules/utils/domain/ulid.vo';

export class UserId extends ULID {
  public static override generate(seedTime?: number): UserId {
    return new UserId(super.generate(seedTime).value);
  }
}
