import type { MapSchema } from '@colyseus/schema';
import { filter, type } from '@colyseus/schema';
import { mapValues, pickBy, sumBy, times } from 'remeda';
import type {
  GenericClient,
  Player,
  PartialFields,
  UnitContext,
  User,
} from '@tft-roller';
import {
  CHAMPIONS_MAP,
  CHAMPIONS_POOL,
  GOLD_PER_REROLL,
  Game,
  GamePhase,
  GameStatus,
  SHOP_SIZE,
  weightedRandom,
} from '@tft-roller';

import { withSchema } from '@src/utils';

import { PlayerSchema } from './player.schema';
import type { UnitSchema } from './unit.schema';
import { UnitsGridSchema } from './units-grid.schema';
import { UserSchema } from './user.schema';

export class GameSchema extends withSchema(Game) {
  @type('string')
  ownerSessionId: string;

  @type('string')
  status: GameStatus;

  @type('number')
  stage: number;

  @type('string')
  phase: GamePhase;

  @type({ map: PlayerSchema })
  players: MapSchema<PlayerSchema>;

  @filter(function (this: GameSchema, client: GenericClient) {
    return !!this.players.get(client.sessionId)?.user.isAdmin;
  })
  @type({ map: 'number' })
  shopChampionPool: MapSchema<number>;

  constructor() {
    super({
      status: GameStatus.InLobby,
      stage: 0,
      phase: GamePhase.Preparation,
      players: {},
      shopChampionPool: CHAMPIONS_POOL,
    });
  }

  addPlayer(user: User, options: PartialFields<Player> = {}) {
    const player = new PlayerSchema({
      gold: 0,
      experience: 0,
      health: 100,
      shopChampionNames: times(SHOP_SIZE, () => ''),
      bench: new UnitsGridSchema({
        height: 1,
        width: 9,
        slots: {},
      }),
      table: new UnitsGridSchema({
        height: 4,
        width: 7,
        slots: {},
      }),
      user: new UserSchema(user),
      ...options,
    });
    this.players.set(player.sessionId, player);
    return player;
  }

  removePlayer(sessionId: string) {
    const player = this.players.get(sessionId);
    if (!player) return;
    player.table.units.forEach((unit) => this.addToChampionPool(unit.name, 1));
    player.bench.units.forEach((unit) => this.addToChampionPool(unit.name, 1));
    this.players.delete(sessionId);
  }

  sellUnit(sessionId: string, { coords, gridType }: UnitContext) {
    if (this.status !== GameStatus.InProgress) return;
    if (this.phase !== GamePhase.Reroll) return;
    const player = this.players.get(sessionId);
    if (!player) return;
    const unit = player[gridType]?.getUnit(coords);
    if (!unit) return;
    player[gridType].setUnit(coords, undefined);
    this.addToChampionPool(unit.name, 1);
    player.gold += unit.sellCost;
  }

  moveUnit(sessionId: string, source: UnitContext, dest: UnitContext) {
    if (this.status !== GameStatus.InProgress) return;
    if (this.phase !== GamePhase.Reroll) return;
    const player = this.players.get(sessionId);
    if (!player?.canMoveUnit(source, dest)) return;

    const sourceGrid = player[source.gridType];
    const destGrid = player[dest.gridType];
    if (!sourceGrid || !destGrid) return;

    const unitFrom = sourceGrid.getUnit(source.coords) as UnitSchema;
    const unitTo = destGrid.getUnit(dest.coords) as UnitSchema;

    if (source.gridType === dest.gridType) {
      sourceGrid.setUnit(source.coords, unitTo).setUnit(dest.coords, unitFrom);
    } else {
      sourceGrid.setUnit(source.coords, unitTo);
      destGrid.setUnit(dest.coords, unitFrom);
    }
  }

  reroll(sessionId: string) {
    if (this.status !== GameStatus.InProgress) return;
    if (this.phase !== GamePhase.Reroll) return;
    const player = this.players.get(sessionId);
    if (!player?.isEnoughGoldToReroll) return;

    player.shopChampionNames.forEach((name) => {
      if (!name) return;
      this.addToChampionPool(name, 1);
    });
    this.rerollShop(sessionId);
    player.gold -= GOLD_PER_REROLL;
  }

  protected addToChampionPool(name: string, amount: number) {
    this.shopChampionPool.set(
      name,
      (this.shopChampionPool.get(name) || 0) + amount,
    );
  }

  rerollShop(sessionId: string) {
    const player = this.players.get(sessionId);
    if (!player) return;
    times(player.shopChampionNames.length, (index) =>
      this.rerollShopSlot(sessionId, index),
    );
  }

  protected rerollShopSlot(sessionId: string, index: number) {
    const player = this.players.get(sessionId);
    if (!player) return;
    const poolByTier: Record<
      number,
      { pool: Record<string, number>; total: number }
    > = {};

    const tierSpec = player.rerollChances.reduce(
      (result, probability, index) => {
        if (probability <= 0) return result;

        const tier = index + 1;
        const poolRecord = Array.from(this.shopChampionPool).reduce(
          (acc, [name, amount]) =>
            Object.assign(acc, {
              [name]: amount,
            }),
          {} as Record<string, number>,
        );
        const pool = pickBy(
          poolRecord,
          (_, name) => CHAMPIONS_MAP[name].tier === tier,
        );
        const total = sumBy(Object.keys(pool), (name) => pool[name]);

        if (total <= 0) return result;

        poolByTier[tier] = { pool, total };
        result[tier] = probability;
        return result;
      },
      {} as Record<number, number>,
    );

    const tier = +weightedRandom(tierSpec);

    const tierPool = poolByTier[tier].pool;
    const totalTierPoolSize = poolByTier[tier].total;

    const champSpec = mapValues(
      pickBy(tierPool, (pool) => pool > 0),
      (size) => size / totalTierPoolSize,
    );
    const championName = weightedRandom(champSpec);

    player.shopChampionNames[index] = championName;

    this.addToChampionPool(championName, -1);
  }

  mergeUnits(
    sessionId: string,
    {
      championName,
      stars = 1,
      minUnitsAmount = 3,
    }: {
      championName: string;
      stars?: number;
      minUnitsAmount?: number;
    },
  ) {
    const player = this.players.get(sessionId);
    if (!player) return;
    const benchCoords = player.bench.getCoordsOfUnitsOfStars(
      championName,
      3,
      stars,
    );
    const tableCoords = player.table.getCoordsOfUnitsOfStars(
      championName,
      3,
      stars,
    );
    if (benchCoords.length + tableCoords.length < minUnitsAmount) {
      return;
    }

    if (tableCoords.length) {
      const [firstUnitCoords, ...restCoords] = tableCoords;
      player.bench.removeUnits(benchCoords);
      player.table.removeUnits(restCoords).upgradeUnit(firstUnitCoords);
    } else {
      const [firstUnitCoords, ...restCoords] = benchCoords;
      player.table.removeUnits(tableCoords);
      player.bench.removeUnits(restCoords).upgradeUnit(firstUnitCoords);
    }

    this.mergeUnits(sessionId, { championName, stars: stars + 1 });
  }
}
