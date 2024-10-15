import { ULID } from 'src/modules/utils/domain/ulid.vo';

export class JobId extends ULID {
  public static override generate(seedTime?: number): JobId {
    return new JobId(super.generate(seedTime).value);
  }
}
