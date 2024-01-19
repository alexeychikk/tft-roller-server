import { Room, Client } from '@colyseus/core';
import { Schema, type } from '@colyseus/schema';

class DummyState extends Schema {
  @type('number') x: number = 0;
  @type('number') y: number = 0;
}

export class DummyRoom extends Room<DummyState> {
  maxClients = 8;

  onCreate(options: unknown) {
    console.log('DummyRoom created', options);
    this.setState(new DummyState({ x: 3, y: 4 }));
  }

  onJoin(client: Client, options: unknown) {
    console.log('client joined', client.sessionId, options);
  }

  onLeave(client: Client, consented: boolean) {
    console.log('client left', client.sessionId, consented);
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }
}
