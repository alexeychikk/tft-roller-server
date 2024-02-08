import { type } from '@colyseus/schema';
import { User } from '@tft-roller';

import { withSchema } from '@src/utils';

export class UserSchema extends withSchema(User) {
  @type('string')
  nickname: string;

  @type('string')
  id: string;

  @type('boolean')
  isAdmin: boolean;
}
