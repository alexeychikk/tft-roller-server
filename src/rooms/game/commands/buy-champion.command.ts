import { Command } from '@colyseus/command';
import { ServerError } from '@colyseus/core';
import { times } from 'remeda';
import { CHAMPIONS_MAP, ErrorCode, GamePhase, GameStatus } from '@tft-roller';

import { UnitSchema } from '@src/schema';
import type { CommandPayload } from '@src/types';
import type { GameRoom } from '../game.room';

export type BuyChampionPayload = CommandPayload<{ index: number }>;

export class BuyChampionCommand extends Command<GameRoom, BuyChampionPayload> {
  override execute() {
    const { client, message } = this.payload;

    if (
      this.state.status !== GameStatus.InProgress ||
      this.state.phase !== GamePhase.Reroll
    )
      throw new ServerError(ErrorCode.BadRequest);

    const player = this.state.players.get(client.sessionId);
    if (!player) throw new ServerError(ErrorCode.Forbidden);

    const championName = player.shopChampionNames[message.index];
    if (!championName) throw new ServerError(ErrorCode.BadRequest);

    const champion = CHAMPIONS_MAP[championName];
    if (player.gold < champion.tier) throw new ServerError(ErrorCode.Forbidden);

    if (!player.bench.firstEmptySlot) {
      const benchUnitsCoords = player.bench.getCoordsOfUnitsOfStars(
        championName,
        2,
        1,
      );
      const tableUnitsCoords = player.table.getCoordsOfUnitsOfStars(
        championName,
        2,
        1,
      );
      if (!benchUnitsCoords.length && !tableUnitsCoords.length) {
        return;
      }

      const shopChampionIndexes = [
        message.index,
        ...player.shopChampionNames
          .map((name, i) => (name === championName ? i : -1))
          .filter((i) => i !== -1 && i !== message.index),
      ];
      const amountToBuy =
        3 - (benchUnitsCoords.length + tableUnitsCoords.length);
      if (shopChampionIndexes.length < amountToBuy) {
        return;
      }
      if (player.gold < amountToBuy * champion.tier) {
        return;
      }

      times(amountToBuy, (i) => {
        player.shopChampionNames[shopChampionIndexes[i]] = '';
      });
      player.gold -= amountToBuy * champion.tier;
      this.state.mergeUnits(client.sessionId, {
        championName,
        minUnitsAmount: 1,
      });
      return;
    }

    player.shopChampionNames[message.index] = '';
    player.bench.setUnit(
      player.bench.firstEmptySlot,
      new UnitSchema({ name: championName, stars: 1 }),
    );
    player.gold -= champion.tier;
    this.state.mergeUnits(client.sessionId, { championName });
  }
}
