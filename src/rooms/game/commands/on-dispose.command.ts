import { Command } from '@colyseus/command';

import type { GameRoom } from '../game.room';

export class OnDisposeCommand extends Command<GameRoom> {
  override async execute() {}
}
