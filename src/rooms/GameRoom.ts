import { Room, Client } from '@colyseus/core';
import { CHAMPIONS_POOL, GameSchema, UnitContext } from '@tft-roller';

export class GameRoom extends Room<GameSchema> {
  maxClients = 8;

  onCreate(options: unknown) {
    console.log('GameRoom created', options);
    const state = new GameSchema({
      players: {},
      shopChampionPool: CHAMPIONS_POOL,
    });
    this.setState(state);

    this.onMessage('buyExperience', (client) => {
      try {
        console.log('buyExperience', client.sessionId);
        this.state.buyExperience(client.sessionId);
      } catch {
        /**/
      }
    });
    this.onMessage('buyChampion', (client, message: { index: number }) => {
      try {
        console.log('buyChampion', client.sessionId);
        this.state.buyChampion(client.sessionId, message.index);
      } catch {
        /**/
      }
    });
    this.onMessage('sellUnit', (client, message: UnitContext) => {
      try {
        console.log('sellUnit', client.sessionId);
        this.state.sellUnit(client.sessionId, message);
      } catch {
        /**/
      }
    });
    this.onMessage(
      'moveUnit',
      (client, message: { source: UnitContext; dest: UnitContext }) => {
        try {
          console.log('moveUnit', client.sessionId);
          this.state.moveUnit(client.sessionId, message.source, message.dest);
        } catch {
          /**/
        }
      },
    );
    this.onMessage('reroll', (client) => {
      try {
        console.log('reroll', client.sessionId);
        this.state.reroll(client.sessionId);
      } catch {
        /**/
      }
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
