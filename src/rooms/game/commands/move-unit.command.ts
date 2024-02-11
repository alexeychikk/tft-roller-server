import { Command } from '@colyseus/command';
import { ServerError } from '@colyseus/core';
import {
  ErrorCode,
  GamePhase,
  GameStatus,
  GridType,
  type UnitContext,
} from '@tft-roller';

import type { UnitSchema } from '@src/schema';
import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type MoveUnitPayload = CommandPayload<{
  source: UnitContext;
  dest: UnitContext;
}>;

export class MoveUnitCommand extends Command<GameRoom, MoveUnitPayload> {
  override execute() {
    const {
      client,
      message: { source, dest },
    } = this.payload;

    if (this.state.status !== GameStatus.InProgress)
      throw new ServerError(ErrorCode.BadRequest);

    if (
      (source.gridType === GridType.Table ||
        dest.gridType === GridType.Table) &&
      this.state.phase !== GamePhase.Reroll
    )
      throw new ServerError(ErrorCode.BadRequest);

    const player = this.state.players.get(client.sessionId);
    if (!player?.canMoveUnit(source, dest))
      throw new ServerError(ErrorCode.BadRequest);

    const sourceGrid = player[source.gridType];
    const destGrid = player[dest.gridType];
    if (!sourceGrid || !destGrid) throw new ServerError(ErrorCode.BadRequest);

    const unitFrom = sourceGrid.getUnit(source.coords) as UnitSchema;
    const unitTo = destGrid.getUnit(dest.coords) as UnitSchema;

    if (source.gridType === dest.gridType) {
      sourceGrid.setUnit(source.coords, unitTo).setUnit(dest.coords, unitFrom);
    } else {
      sourceGrid.setUnit(source.coords, unitTo);
      destGrid.setUnit(dest.coords, unitFrom);
    }
  }
}
