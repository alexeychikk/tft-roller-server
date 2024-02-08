import { Schema } from '@colyseus/schema';
import type { Class } from 'utility-types';
import type { SchemaConstructorParams } from '@tft-roller';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withSchema<T extends Class<any>>(
  baseClass: T,
): typeof Schema &
  (new (
    options?: SchemaConstructorParams<InstanceType<T>>,
  ) => InstanceType<T>) {
  function WithSchema(this: Schema & InstanceType<T>, ...options: unknown[]) {
    // @ts-expect-error - schema super() call
    Schema.apply(this, options);
  }
  Object.setPrototypeOf(WithSchema.prototype, Schema.prototype);

  const descriptors = Object.getOwnPropertyDescriptors(baseClass.prototype);
  for (const key in descriptors) {
    if (key === 'constructor') continue;
    Object.defineProperty(WithSchema.prototype, key, descriptors[key]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return WithSchema as any;
}
