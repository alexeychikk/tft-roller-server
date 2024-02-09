import { Command } from '@colyseus/command';
import { ServerError } from '@colyseus/core';
import {
  EXPERIENCE_PER_BUY,
  ErrorCode,
  GOLD_PER_EXPERIENCE_BUY,
  GamePhase,
  GameStatus,
} from '@tft-roller';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type BuyExperiencePayload = CommandPayload;

export class BuyExperienceCommand extends Command<
  GameRoom,
  BuyExperiencePayload
> {
  override execute() {
    const { client } = this.payload;

    if (
      this.state.status !== GameStatus.InProgress ||
      this.state.phase !== GamePhase.Reroll
    )
      throw new ServerError(ErrorCode.BadRequest);

    const player = this.state.players.get(client.sessionId);
    if (
      !player ||
      !player.isEnoughGoldToBuyExperience ||
      player.isMaxLevelReached
    )
      throw new ServerError(ErrorCode.BadRequest);

    player.experience += EXPERIENCE_PER_BUY;
    player.gold -= GOLD_PER_EXPERIENCE_BUY;
  }
}
