import { Command } from '@colyseus/command';
import { ServerError } from '@colyseus/core';
import { ErrorCode, JoinGameDto, validate } from '@tft-roller';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type OnJoinPayload = CommandPayload<JoinGameDto>;

export class OnJoinCommand extends Command<GameRoom, OnJoinPayload> {
  override async execute() {
    const { client, message } = this.payload;
    const dto = await validate(JoinGameDto, message);

    const { ownerId, password } = this.room.options;
    if (password && password !== dto.password) {
      throw new ServerError(ErrorCode.Unauthorized);
    }
    if (!this.state.ownerSessionId) {
      // Admin must always join first
      if (ownerId !== client.auth?.id) {
        throw new ServerError(ErrorCode.Forbidden);
      }
      this.state.ownerSessionId = client.sessionId;
    }

    this.state.createPlayer(client.auth!, {
      sessionId: client.sessionId,
    });
  }
}
