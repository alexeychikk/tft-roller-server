import type { Client } from '@colyseus/core';
import { logger, Room } from '@colyseus/core';
import type { UnitContext } from '@tft-roller';
import { CHAMPIONS_POOL, GameMessageType, GameSchema } from '@tft-roller';

export class GameRoom extends Room<GameSchema> {
  maxClients = 8;

  onCreate(options: unknown) {
    logger.info('GameRoom created', options);
    const state = new GameSchema({
      players: {},
      shopChampionPool: CHAMPIONS_POOL,
    });
    this.setState(state);

    this.onMessage(GameMessageType.BuyExperience, (client) => {
      try {
        logger.info(GameMessageType.BuyExperience, client.sessionId);
        this.state.buyExperience(client.sessionId);
      } catch {
        /**/
      }
    });
    this.onMessage(
      GameMessageType.BuyChampion,
      (client, message: { index: number }) => {
        try {
          logger.info(GameMessageType.BuyChampion, client.sessionId);
          this.state.buyChampion(client.sessionId, message.index);
        } catch {
          /**/
        }
      },
    );
    this.onMessage(GameMessageType.SellUnit, (client, message: UnitContext) => {
      try {
        logger.info(GameMessageType.SellUnit, client.sessionId);
        this.state.sellUnit(client.sessionId, message);
      } catch {
        /**/
      }
    });
    this.onMessage(
      GameMessageType.MoveUnit,
      (client, message: { source: UnitContext; dest: UnitContext }) => {
        try {
          logger.info(GameMessageType.MoveUnit, client.sessionId);
          this.state.moveUnit(client.sessionId, message.source, message.dest);
        } catch {
          /**/
        }
      },
    );
    this.onMessage(GameMessageType.Reroll, (client) => {
      try {
        logger.info(GameMessageType.Reroll, client.sessionId);
        this.state.reroll(client.sessionId);
      } catch {
        /**/
      }
    });
  }

  onJoin(client: Client, options: unknown) {
    logger.info('client joined', client.sessionId, options);
    try {
      this.state.createPlayer(client.sessionId);
    } catch {
      /**/
    }
  }

  onLeave(client: Client, consented: boolean) {
    logger.info('client left', client.sessionId, consented);
    try {
      this.state.removePlayer(client.sessionId);
    } catch {
      /**/
    }
  }

  onDispose() {
    logger.info('room', this.roomId, 'disposed');
  }
}
