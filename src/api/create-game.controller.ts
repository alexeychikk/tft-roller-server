import type { Request } from '@colyseus/auth';
import type { RoomListingData } from '@colyseus/core';
import { matchMaker } from '@colyseus/core';
import type { Response } from 'express';
import type { GameMeta, GameRoomEntity, User } from '@tft-roller';
import { CreateGameDto, RoomType, validate } from '@tft-roller';

export async function createGame(req: Request<User>, res: Response) {
  try {
    const dto = await validate(CreateGameDto, req.body);
    const room: RoomListingData<GameMeta> = await matchMaker.createRoom(
      RoomType.Game,
      { ...dto, ownerId: req.auth?.id },
    );
    const entity: GameRoomEntity = { roomId: room.roomId };
    res.status(201).json(entity);
  } catch (error) {
    res.status(400).json(error);
  }
}
