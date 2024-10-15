import { User } from 'src/modules/user/domain/user';

export type AccessTokenPayload = {
  sub: string;
};

export type AuthTokens = {
  accessToken: string;
};

export type GenerateRefreshTokenInput = {
  user: User;
};
