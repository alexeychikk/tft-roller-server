import { Command } from '@colyseus/command';
import { ServerError } from '@colyseus/core';
import {
  ErrorCode,
  GamePhase,
  GameStatus,
  type UnitContext,
} from '@tft-roller';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type SellUnitPayload = CommandPayload<UnitContext>;

export class SellUnitCommand extends Command<GameRoom, SellUnitPayload> {
  override execute() {
    const { client, message } = this.payload;

    if (
      this.state.status !== GameStatus.InProgress ||
      this.state.phase !== GamePhase.Reroll
    )
      throw new ServerError(ErrorCode.BadRequest);

    const player = this.state.players.get(client.sessionId);
    if (!player) throw new ServerError(ErrorCode.Forbidden);

    const unit = player[message.gridType]?.getUnit(message.coords);
    if (!unit) throw new ServerError(ErrorCode.BadRequest);

    player[message.gridType].setUnit(message.coords, undefined);
    this.state.addToChampionPool(unit.name, 1);
    player.gold += unit.sellCost;
  }
}
