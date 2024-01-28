import { Command } from '@colyseus/command';
import type { UnitContext } from '@tft-roller';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type MoveUnitPayload = CommandPayload<{
  source: UnitContext;
  dest: UnitContext;
}>;

export class MoveUnitCommand extends Command<GameRoom, MoveUnitPayload> {
  override execute() {
    const { client, message } = this.payload;
    this.state.moveUnit(client.sessionId, message.source, message.dest);
  }
}
