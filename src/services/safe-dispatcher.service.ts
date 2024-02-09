import type { Command } from '@colyseus/command';
import { Dispatcher } from '@colyseus/command';
import type { Room } from '@colyseus/core';
import { ServerError } from '@colyseus/core';
import { ErrorCode } from '@tft-roller';

import type { CommandPayload } from '@src/types';

export class SafeDispatcher<R extends Room> extends Dispatcher<R> {
  override async dispatch<T extends Command>(
    command: T,
    payload?: T['payload'],
  ): Promise<unknown> {
    try {
      return await super.dispatch(command, payload);
    } catch (error) {
      if (
        !(error instanceof ServerError) ||
        error.code >= ErrorCode.InternalServerError
      ) {
        console.error('Error dispatching command', command, error);
        return;
      }

      const sessionId = (payload as CommandPayload)?.client?.sessionId;
      if (sessionId) {
        this.room.clients.getById(sessionId)?.error(error.code, error.message);
      }
    }
  }
}
