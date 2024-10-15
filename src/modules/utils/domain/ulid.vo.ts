import { generateULID, isULID } from '../id';
import { ValueObject } from './value-object';

export class ULID extends ValueObject<string> {
  constructor(value: string) {
    if (!ULID.isULID(value)) {
      ValueObject.raiseException('ULID is not valid');
    }

    super(value);
  }

  public static generate(seedTime?: number): ULID {
    return new ULID(generateULID(seedTime));
  }

  public static isULID(value: string): boolean {
    return isULID(value);
  }
}
