import type { AuthClient } from '@tft-roller';

export type CommandPayload<M = undefined> = M extends undefined
  ? { client: AuthClient }
  : { client: AuthClient; message: M };
