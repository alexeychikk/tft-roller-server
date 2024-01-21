import type { Options } from '@colyseus/loadtest';
import { cli } from '@colyseus/loadtest';
import type { Room } from 'colyseus.js';
import { Client } from 'colyseus.js';

export async function main(options: Options) {
  const client = new Client(options.endpoint);
  const room: Room = await client.joinOrCreate(options.roomName, {});

  room.onMessage('message-type', (/* payload */) => {});

  room.onStateChange((/* state */) => {});

  room.onLeave((/* code */) => {});
}

cli(main);
