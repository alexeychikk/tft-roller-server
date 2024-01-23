import type { Client } from '@colyseus/core';
import { LobbyRoom, logger, matchMaker } from '@colyseus/core';
import type { LobbyOptions } from '@colyseus/core/build/rooms/LobbyRoom';
import type { GameOptions } from '@tft-roller';
import {
  validate,
  JoinLobbyOptions,
  CreateGameOptions,
  RoomType,
  LobbyMessageType,
} from '@tft-roller';

export class PublicLobbyRoom extends LobbyRoom {
  autoDispose = false;
  maxClients = 10000;

  async onCreate(options: unknown) {
    super.onCreate(options);
    logger.info('created lobby', options);

    this.onMessage(
      LobbyMessageType.CreateGame,
      async (client, options: CreateGameOptions) => {
        try {
          const createOptions = await validate(CreateGameOptions, options);
          logger.info('create game', client.sessionId, createOptions);
          const gameOptions: GameOptions = {
            ...createOptions,
            ownerId: client.sessionId,
          };
          const gameRoom = await matchMaker.createRoom(
            RoomType.Game,
            gameOptions,
          );
          client.send(LobbyMessageType.CreateGame, {
            roomId: gameRoom.roomId,
          });
        } catch {
          logger.info('invalid JoinLobbyOptions', client.sessionId, options);
        }
      },
    );
  }

  async onJoin(client: Client, options: LobbyOptions & JoinLobbyOptions) {
    try {
      // TODO: proper auth
      const lobbyOptions = await validate(JoinLobbyOptions, options);
      super.onJoin(client, options);

      logger.info('joined lobby', client.sessionId, lobbyOptions);
      client.userData = lobbyOptions;
    } catch {
      logger.info('invalid JoinLobbyOptions', client.sessionId, options);
      client.leave();
      return;
    }
  }
}
