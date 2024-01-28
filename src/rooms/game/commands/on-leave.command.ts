import { Command } from '@colyseus/command';
import type { PlayerSchema } from '@tft-roller';

import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type OnLeavePayload = CommandPayload<{ consented?: boolean }>;

export class OnLeaveCommand extends Command<GameRoom, OnLeavePayload> {
  override async execute() {
    const { client } = this.payload;

    this.state.removePlayer(client.sessionId);

    if (
      client.sessionId === this.state.ownerSessionId &&
      this.state.players.size > 0
    ) {
      const player: PlayerSchema = this.state.players.values().next().value;
      this.state.ownerSessionId = player.sessionId;
      await this.room.setMetadata({ ownerId: player.user.id });
    }
  }
}
