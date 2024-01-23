import type { RegisterAnonymouslyCallback } from '@colyseus/auth/build/auth';
import { nanoid } from 'nanoid';
import type { User } from '@tft-roller';
import { SignInAnonymouslyDto, validate } from '@tft-roller';

export const onRegisterAnonymously: RegisterAnonymouslyCallback = async (
  data: SignInAnonymouslyDto,
): Promise<User> => {
  const dto = await validate(SignInAnonymouslyDto, data);
  return {
    ...dto,
    id: nanoid(),
    isAdmin: dto.password === process.env.ADMIN_PASSWORD,
  };
};
