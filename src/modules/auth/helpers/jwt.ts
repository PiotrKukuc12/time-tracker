import { jwtDecode } from 'jwt-decode';

export type AccessTokenType = 'Bearer' | 'Basic';

export function getJwtFromHeaders(
  headers: Record<string, string | string[] | undefined>,
  tokenType: AccessTokenType = 'Bearer',
): string | null {
  const authHeader = headers['authorization'] || headers['Authorization'];

  if (!authHeader) {
    return null;
  }

  const value = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (!value || typeof value !== 'string') {
    return null;
  }

  const [type, token] = value.split(' ');

  if (type !== tokenType || !token) {
    return null;
  }

  return token;
}

export function isJwtExpired(token: string): boolean {
  const decoded = jwtDecode<{ exp: number }>(token);
  return decoded.exp * 1000 < Date.now();
}

export function decodeJwt<T>(token: string): T {
  return jwtDecode<T>(token);
}
