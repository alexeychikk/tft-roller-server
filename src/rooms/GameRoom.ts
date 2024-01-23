import { JWT } from '@colyseus/auth';
import type { Client } from '@colyseus/core';
import { logger, Room, ServerError } from '@colyseus/core';
import type {
  GameMeta,
  GameOptions,
  PlayerSchema,
  UnitContext,
  User,
} from '@tft-roller';
import {
  GameStatus,
  JoinGameDto,
  CHAMPIONS_POOL,
  ErrorCode,
  GameMessageType,
  GameSchema,
  validate,
} from '@tft-roller';

export class GameRoom extends Room<GameSchema, GameMeta> {
  maxClients = 8;
  options: GameOptions;

  static async onAuth(token: string) {
    return await JWT.verify(token);
  }

  async onCreate(options: GameOptions) {
    logger.info('GameRoom', this.roomId, 'created', options);
    this.options = options;
    await this.setMetadata({ name: options.name, ownerId: options.ownerId });

    const state = new GameSchema({
      status: GameStatus.InLobby,
      players: {},
      shopChampionPool: CHAMPIONS_POOL,
    });
    this.setState(state);

    this.onMessage(GameMessageType.Start, (client) => {
      try {
        logger.info(this.roomId, GameMessageType.Start, client.sessionId);
        this.state.start(client.sessionId);
      } catch {
        /**/
      }
    });
    this.onMessage(GameMessageType.BuyExperience, (client) => {
      try {
        logger.info(
          this.roomId,
          GameMessageType.BuyExperience,
          client.sessionId,
        );
        this.state.buyExperience(client.sessionId);
      } catch {
        /**/
      }
    });
    this.onMessage(
      GameMessageType.BuyChampion,
      (client, message: { index: number }) => {
        try {
          logger.info(
            this.roomId,
            GameMessageType.BuyChampion,
            client.sessionId,
          );
          this.state.buyChampion(client.sessionId, message.index);
        } catch {
          /**/
        }
      },
    );
    this.onMessage(GameMessageType.SellUnit, (client, message: UnitContext) => {
      try {
        logger.info(this.roomId, GameMessageType.SellUnit, client.sessionId);
        this.state.sellUnit(client.sessionId, message);
      } catch {
        /**/
      }
    });
    this.onMessage(
      GameMessageType.MoveUnit,
      (client, message: { source: UnitContext; dest: UnitContext }) => {
        try {
          logger.info(this.roomId, GameMessageType.MoveUnit, client.sessionId);
          this.state.moveUnit(client.sessionId, message.source, message.dest);
        } catch {
          /**/
        }
      },
    );
    this.onMessage(GameMessageType.Reroll, (client) => {
      try {
        logger.info(this.roomId, GameMessageType.Reroll, client.sessionId);
        this.state.reroll(client.sessionId);
      } catch {
        /**/
      }
    });
  }

  async onJoin(client: GameClient, data: JoinGameDto) {
    logger.info('GameRoom', this.roomId, 'client joined', client.sessionId);
    const dto = await validate(JoinGameDto, data);

    if (this.options.password && this.options.password !== dto.password) {
      throw new ServerError(ErrorCode.Unauthorized);
    }
    if (!this.state.ownerSessionId) {
      // Admin must always join first
      if (this.options.ownerId !== client.auth?.id) {
        throw new ServerError(ErrorCode.Forbidden);
      }
      this.state.ownerSessionId = client.sessionId;
    }

    this.state.createPlayer({
      id: client.auth!.id,
      isAdmin: client.auth!.isAdmin,
      sessionId: client.sessionId,
    });
  }

  async onLeave(client: GameClient, consented: boolean) {
    logger.info(
      'GameRoom',
      this.roomId,
      'client left',
      client.sessionId,
      consented,
    );

    this.state.removePlayer(client.sessionId);

    if (
      client.sessionId === this.state.ownerSessionId &&
      this.state.players.size > 0
    ) {
      const player: PlayerSchema = this.state.players.values().next().value;
      this.state.ownerSessionId = player.sessionId;
      await this.setMetadata({ ownerId: player.id });
    }
  }

  async onDispose() {
    logger.info('GameRoom', this.roomId, 'disposed');
  }
}

type GameClient = Client<unknown, User>;
