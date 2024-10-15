import { UserRole } from 'src/modules/database/schema/user/user.schema';
import { User } from 'src/modules/user/domain/user';

export type AccessTokenPayload = {
  sub: string;
  roles: UserRole[];
};

export type AuthTokens = {
  accessToken: string;
};

export type GenerateRefreshTokenInput = {
  user: User;
};
