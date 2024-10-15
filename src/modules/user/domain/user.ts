import { UserRole, UserStatus } from '../../database/schema/user/user.schema';
import { dbSchema } from '../../database';
import { Password } from './value-objects/string/password.vo';
import { UserId } from './value-objects/ids/user-id.vo';
import { Email } from './value-objects/string/email.vo';
import { DateUtil } from '../../../modules/utils';

export type UserInsertType = typeof dbSchema.users.$inferInsert;
export type UserSelectType = typeof dbSchema.users.$inferSelect;

export type UserConnectInput = {
  email: string;
  password: string;
  status: UserStatus;
  verifyToken: string | null;
};

export type UserProps = {
  id: UserId;
  email: Email;
  password: Password;
  status: UserStatus;
  verifyToken: string | null;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
};

export class User implements UserProps {
  public readonly id: UserId;
  public readonly password: Password;
  public email: Email;
  public status: UserStatus;
  public verifyToken: string | null;
  public updatedAt: Date;
  public readonly createdAt: Date;
  public roles: UserRole[];

  constructor(props: UserProps) {
    Object.assign(this, props);
  }

  public update(
    partialProps: Partial<Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>>,
  ): void {
    if (partialProps.email) {
      this.email = new Email(partialProps.email.value);
    }

    if (partialProps.status) {
      this.status = partialProps.status;
    }

    if (partialProps.verifyToken !== undefined) {
      this.verifyToken = partialProps.verifyToken;
    }

    if (partialProps.roles) {
      this.roles = partialProps.roles;
    }

    this.updatedAt = DateUtil.now;
  }

  public static async connect({
    email,
    password,
    verifyToken,
    status,
  }: UserConnectInput) {
    return new User({
      id: UserId.generate(),
      email: new Email(email),
      password: await Password.generateHashFrom(password),
      verifyToken,
      status,
      roles: [UserRole.USER],
      createdAt: DateUtil.now,
      updatedAt: DateUtil.now,
    });
  }

  public static toDomain(input: UserSelectType): User {
    return new User({
      id: new UserId(input.id),
      verifyToken: input.verifyToken,
      email: new Email(input.email),
      password: new Password(input.password),
      status: input.status,
      roles: input.roles,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });
  }

  public toInsert(): UserInsertType {
    return {
      id: this.id.value,
      email: this.email.value,
      password: this.password.value,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      verifyToken: this.verifyToken,
    };
  }
}
