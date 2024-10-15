import { ulid, isValid } from 'ulidx';

export function generateULID(seedTime?: number): string {
  return ulid(seedTime);
}

export function isULID(id: string): boolean {
  return isValid(id);
}
