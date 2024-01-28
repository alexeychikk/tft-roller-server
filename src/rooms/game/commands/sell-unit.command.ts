import { Command } from '@colyseus/command';
import type { UnitContext } from '@tft-roller';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type SellUnitPayload = CommandPayload<UnitContext>;

export class SellUnitCommand extends Command<GameRoom, SellUnitPayload> {
  override execute() {
    const { client, message } = this.payload;
    this.state.sellUnit(client.sessionId, message);
  }
}
