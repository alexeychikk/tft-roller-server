import { JWT } from '@colyseus/auth';
import { LobbyRoom } from '@colyseus/core';

export class PublicLobbyRoom extends LobbyRoom {
  autoDispose = false;
  maxClients = 10000;

  static async onAuth(token: string) {
    return await JWT.verify(token);
  }
}
