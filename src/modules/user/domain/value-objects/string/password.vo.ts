import * as bcrypt from 'bcrypt';
import { ValueObject } from 'src/modules/utils/domain/value-object';

export class Password extends ValueObject<string> {
  constructor(value: string) {
    super(value);
  }

  public compare(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.value);
  }

  public static async generateHashFrom(value: string): Promise<Password> {
    if (value.length < 8) {
      ValueObject.raiseException('Password must be at least 8 characters long');
    }
    const saltRounds = 10;
    const hash = await bcrypt.hash(value, saltRounds);

    return new Password(hash);
  }
}
