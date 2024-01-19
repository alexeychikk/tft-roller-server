import { Room, Client } from '@colyseus/core';
import { Game, UnitContext } from '@tft-roller';

export class GameRoom extends Room<Game> {
  maxClients = 8;

  onCreate(options: unknown) {
    console.log('GameRoom created', options);
    this.setState(new Game());

    this.onMessage('buyExperience', (client) => {
      console.log('buyExperience', client.sessionId);
      this.state.buyExperience(client.sessionId);
    });
    this.onMessage('buyChampion', (client, message: { index: number }) => {
      console.log('buyChampion', client.sessionId);
      this.state.buyChampion(client.sessionId, message.index);
    });
    this.onMessage('sellUnit', (client, message: UnitContext) => {
      console.log('sellUnit', client.sessionId);
      this.state.sellUnit(client.sessionId, message);
    });
    this.onMessage(
      'moveUnit',
      (client, message: { source: UnitContext; dest: UnitContext }) => {
        console.log('moveUnit', client.sessionId);
        this.state.moveUnit(client.sessionId, message.source, message.dest);
      },
    );
    this.onMessage('reroll', (client) => {
      console.log('reroll', client.sessionId);
      this.state.reroll(client.sessionId);
    });
  }

  onJoin(client: Client, options: unknown) {
    console.log('client joined', client.sessionId, options);
    this.state.createPlayer(client.sessionId);
  }

  onLeave(client: Client, consented: boolean) {
    console.log('client left', client.sessionId, consented);
    this.state.removePlayer(client.sessionId);
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }
}
