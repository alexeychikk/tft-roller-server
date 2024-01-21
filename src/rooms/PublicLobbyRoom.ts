import type { Client } from '@colyseus/core';
import { LobbyRoom, logger } from '@colyseus/core';
import type { LobbyOptions } from '@colyseus/core/build/rooms/LobbyRoom';
import { validate, JoinLobbyOptions } from '@tft-roller';

export class PublicLobbyRoom extends LobbyRoom {
  autoDispose = false;
  maxClients = 10000;

  async onJoin(client: Client, options: LobbyOptions & JoinLobbyOptions) {
    try {
      const lobbyOptions = await validate(JoinLobbyOptions, options);
      super.onJoin(client, options);

      logger.info('joined lobby', client.sessionId, lobbyOptions);
      client.userData = lobbyOptions;
    } catch {
      logger.error('invalid JoinLobbyOptions', client.sessionId, options);
      client.leave(1007);
      return;
    }
  }
}
