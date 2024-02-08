import { JWT } from '@colyseus/auth';
import { Dispatcher } from '@colyseus/command';
import type { Client } from '@colyseus/core';
import { logger, Room } from '@colyseus/core';
import type { GameMeta, GameOptions, User, JoinGameDto } from '@tft-roller';
import { GameMessageType } from '@tft-roller';

import { GameSchema } from '@src/schema';

import {
  BuyChampionCommand,
  BuyExperienceCommand,
  MoveUnitCommand,
  OnDisposeCommand,
  OnJoinCommand,
  OnLeaveCommand,
  RerollCommand,
  SellUnitCommand,
  StartCommand,
} from './commands';

export class GameRoom extends Room<GameSchema, GameMeta> {
  maxClients = 8;
  options: GameOptions;
  dispatcher = new Dispatcher(this);

  static async onAuth(token: string) {
    return await JWT.verify(token);
  }

  async onCreate(options: GameOptions) {
    logger.info('GameRoom', this.roomId, 'created', options);
    this.options = options;
    await this.setMetadata({
      name: options.name,
      ownerId: options.ownerId,
      protected: !!options.password,
    });

    const state = new GameSchema({ clock: this.clock });
    this.setState(state);

    this.onMessage(GameMessageType.Start, (client) => {
      this.dispatcher.dispatch(new StartCommand(), { client });
    });
    this.onMessage(GameMessageType.BuyExperience, (client) => {
      this.dispatcher.dispatch(new BuyExperienceCommand(), { client });
    });
    this.onMessage(GameMessageType.BuyChampion, (client, message) => {
      this.dispatcher.dispatch(new BuyChampionCommand(), {
        client,
        message,
      });
    });
    this.onMessage(GameMessageType.SellUnit, (client, message) => {
      this.dispatcher.dispatch(new SellUnitCommand(), {
        client,
        message,
      });
    });
    this.onMessage(GameMessageType.MoveUnit, (client, message) => {
      this.dispatcher.dispatch(new MoveUnitCommand(), {
        client,
        message,
      });
    });
    this.onMessage(GameMessageType.Reroll, (client) => {
      this.dispatcher.dispatch(new RerollCommand(), { client });
    });
  }

  async onJoin(client: GameClient, message: JoinGameDto) {
    this.dispatcher.dispatch(new OnJoinCommand(), { client, message });
  }

  async onLeave(client: GameClient, consented: boolean) {
    this.dispatcher.dispatch(new OnLeaveCommand(), {
      client,
      message: { consented },
    });
  }

  async onDispose() {
    this.dispatcher.dispatch(new OnDisposeCommand());
  }
}

type GameClient = Client<unknown, User>;
