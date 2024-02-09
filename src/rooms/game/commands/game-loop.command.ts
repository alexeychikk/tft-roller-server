import { Command } from '@colyseus/command';
import { GamePhase, GameStatus, TIME_PER_PHASE } from '@tft-roller';

import type { GameRoom } from '../game.room';

export class GameLoopCommand extends Command<GameRoom> {
  override async execute() {
    this.gameLoop();
  }

  protected async gameLoop() {
    switch (this.state.phase) {
      case GamePhase.Preparation: {
        this.state.players.forEach((player) => {
          player.gold += 50;
        });
        this.clock.setTimeout(() => {
          this.state.phase = GamePhase.Reroll;
          this.gameLoop();
        }, TIME_PER_PHASE[GamePhase.Preparation]);
        return;
      }

      case GamePhase.Reroll: {
        this.clock.setTimeout(() => {
          this.state.phase = GamePhase.Combat;
          this.gameLoop();
        }, TIME_PER_PHASE[GamePhase.Reroll]);
        return;
      }

      case GamePhase.Combat: {
        this.state.players.forEach((player) => {
          // TODO: combat logic
          player.health -= 10;
        });

        this.clock.setTimeout(() => {
          this.state.phase = GamePhase.Elimination;
          this.gameLoop();
        }, TIME_PER_PHASE[GamePhase.Combat]);
        return;
      }

      case GamePhase.Elimination: {
        this.state.players.forEach((player) => {
          if (player.health <= 0) {
            this.state.removePlayer(player.sessionId);
          }
        });

        if (this.state.players.size <= 1) {
          this.state.status = GameStatus.Finished;
          return;
        }

        this.clock.setTimeout(() => {
          this.state.stage++;
          this.state.phase = GamePhase.Preparation;
          this.gameLoop();
        }, TIME_PER_PHASE[GamePhase.Elimination]);
        return;
      }
    }
  }
}
