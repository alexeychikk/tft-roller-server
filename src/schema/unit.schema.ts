import { type } from '@colyseus/schema';
import { Unit } from '@tft-roller';

import { withSchema } from '@src/utils';

export class UnitSchema extends withSchema(Unit) {
  @type('string') name: string;
  @type('number') stars: number;
}
