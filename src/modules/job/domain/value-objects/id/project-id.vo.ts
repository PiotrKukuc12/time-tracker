import { ULID } from 'src/modules/utils/domain/ulid.vo';

export class ProjectId extends ULID {
  public static override generate(seedTime?: number): ProjectId {
    return new ProjectId(super.generate(seedTime).value);
  }
}
