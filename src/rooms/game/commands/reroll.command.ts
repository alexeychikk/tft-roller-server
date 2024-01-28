import { Command } from '@colyseus/command';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type RerollCommandPayload = CommandPayload;

export class RerollCommand extends Command<GameRoom, RerollCommandPayload> {
  override execute() {
    const { client } = this.payload;
    this.state.reroll(client.sessionId);
  }
}
