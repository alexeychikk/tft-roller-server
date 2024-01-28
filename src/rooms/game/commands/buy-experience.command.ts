import { Command } from '@colyseus/command';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type BuyExperiencePayload = CommandPayload;

export class BuyExperienceCommand extends Command<
  GameRoom,
  BuyExperiencePayload
> {
  override execute() {
    const { client } = this.payload;
    this.state.buyExperience(client.sessionId);
  }
}
