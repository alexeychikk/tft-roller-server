import { Command } from '@colyseus/command';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type StartCommandPayload = CommandPayload;

export class StartCommand extends Command<GameRoom, StartCommandPayload> {
  override execute() {
    const { client } = this.payload;
    const started = this.state.start(client.sessionId);
    if (started) this.room.lock();
  }
}
