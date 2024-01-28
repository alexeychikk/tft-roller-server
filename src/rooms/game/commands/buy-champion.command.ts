import { Command } from '@colyseus/command';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type BuyChampionPayload = CommandPayload<{ index: number }>;

export class BuyChampionCommand extends Command<GameRoom, BuyChampionPayload> {
  override execute() {
    const { client, message } = this.payload;
    this.state.buyChampion(client.sessionId, message.index);
  }
}
