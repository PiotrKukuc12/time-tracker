import { UserRole } from 'src/modules/database/schema/user/user.schema';

export enum RoleMatchingMode {
  ALL = 'ALL',
  ANY = 'ANY',
}

export interface AuthenticatedUserInput {
  sub: string;
  accessToken: string;
  roles: UserRole[];
}

export class AuthenticatedUser {
  public readonly id: string;
  public readonly roles: UserRole[];
  public readonly accessToken: string;

  constructor(data: AuthenticatedUserInput) {
    this.id = data.sub;
    this.roles = data.roles;
    this.accessToken = data.accessToken;
  }

  public isAdmin(): boolean {
    return this.hasRoles([UserRole.ADMIN]);
  }

  public hasRoles(
    roles: string[],
    mode: RoleMatchingMode = RoleMatchingMode.ANY,
  ): boolean {
    if (mode === RoleMatchingMode.ANY) {
      return roles.some((role) => this.roles.includes(role as UserRole));
    }
    return roles.every((role) => this.roles.includes(role as UserRole));
  }

  public static isAuthenticatedUser(data: unknown): data is AuthenticatedUser {
    return data instanceof AuthenticatedUser && !!data.id;
  }
}
