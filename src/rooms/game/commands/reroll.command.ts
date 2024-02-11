import { Command } from '@colyseus/command';
import { ServerError } from '@colyseus/core';
import { ErrorCode, GOLD_PER_REROLL, GamePhase, GameStatus } from '@tft-roller';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type RerollCommandPayload = CommandPayload;

export class RerollCommand extends Command<GameRoom, RerollCommandPayload> {
  override execute() {
    const { client } = this.payload;

    if (
      this.state.status !== GameStatus.InProgress ||
      this.state.phase !== GamePhase.Reroll
    )
      throw new ServerError(ErrorCode.BadRequest);

    const player = this.state.players.get(client.sessionId);
    if (!player?.isEnoughGoldToReroll)
      throw new ServerError(ErrorCode.Forbidden);

    player.shopChampionNames.forEach((name) => {
      if (!name) return;
      this.state.addToChampionPool(name, 1);
    });
    this.state.rerollShop(client.sessionId);
    player.gold -= GOLD_PER_REROLL;
  }
}
