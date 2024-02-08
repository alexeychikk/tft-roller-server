import type { ArraySchema } from '@colyseus/schema';
import { filter, type } from '@colyseus/schema';
import type { GenericClient } from '@tft-roller';
import { Player } from '@tft-roller';

import { withSchema } from '@src/utils';

import { UnitsGridSchema } from './units-grid.schema';
import { UserSchema } from './user.schema';

export class PlayerSchema extends withSchema(Player) {
  @type(UserSchema) user: UserSchema;
  @type('string') sessionId: string;
  @type('number') gold: number;
  @type('number') experience: number;
  @type('number') health: number;

  @filter(function (this: PlayerSchema, client: GenericClient) {
    return this.sessionId === client.sessionId;
  })
  @type(['string'])
  shopChampionNames: ArraySchema<string>;

  @type(UnitsGridSchema) bench: UnitsGridSchema;
  @type(UnitsGridSchema) table: UnitsGridSchema;
}
