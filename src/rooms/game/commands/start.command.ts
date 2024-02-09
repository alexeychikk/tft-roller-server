import { Command } from '@colyseus/command';
import { ServerError } from '@colyseus/core';
import { ErrorCode, GameStatus } from '@tft-roller';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

import { GameLoopCommand } from './game-loop.command';

export type StartCommandPayload = CommandPayload;

export class StartCommand extends Command<GameRoom, StartCommandPayload> {
  override async execute() {
    const { client } = this.payload;

    if (this.state.status !== GameStatus.InLobby)
      throw new ServerError(ErrorCode.BadRequest);
    if (this.state.players.size < 2)
      throw new ServerError(ErrorCode.BadRequest);
    const player = this.state.players.get(client.sessionId);
    if (player?.sessionId !== this.state.ownerSessionId)
      throw new ServerError(ErrorCode.Forbidden);

    this.room.lock();
    this.state.players.forEach((player) =>
      this.state.rerollShop(player.sessionId),
    );
    this.state.status = GameStatus.InProgress;

    this.room.dispatcher.dispatch(new GameLoopCommand());
  }
}
