import { ValueObject } from 'src/modules/utils/domain/value-object';

export const EMAIL_REGEX =
  /^(?!.*\.\.)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;

export class Email extends ValueObject<string> {
  constructor(value: string) {
    if (!EMAIL_REGEX.test(value)) {
      ValueObject.raiseException('Invalid email');
    }

    super(value);
  }
}
