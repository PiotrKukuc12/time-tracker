import { BadRequestException } from '@nestjs/common';

import { shallowEqual } from 'shallow-equal';

export type RecordType<T = unknown> = T extends object
  ? { [K in keyof T]: T[K] }
  : Record<string | symbol | number, unknown>;

export interface Equatable<T> {
  equals(data: T): boolean;
}

export abstract class ValueObject<T> implements Equatable<ValueObject<T>> {
  constructor(public readonly value: T) {
    if (this.isEmpty(value)) {
      throw new BadRequestException('ValueObject cannot be empty');
    }
  }

  public toString(): string {
    return JSON.stringify(this);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (!vo || !vo.value) {
      return false;
    }

    return shallowEqual(this.value as RecordType, vo.value as RecordType);
  }

  public static isValueObject<T = unknown>(
    obj: unknown,
  ): obj is ValueObject<T> {
    return obj instanceof ValueObject;
  }

  private isEmpty(value: T): boolean {
    return !value || value === '';
  }

  protected static raiseException(message: string): void {
    throw new BadRequestException(message);
  }
}
