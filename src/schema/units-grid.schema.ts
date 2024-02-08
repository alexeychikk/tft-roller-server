import type { MapSchema } from '@colyseus/schema';
import { type } from '@colyseus/schema';
import type { Coords } from '@tft-roller';
import { UnitsGrid } from '@tft-roller';

import { withSchema } from '@src/utils';

import { UnitSchema } from './unit.schema';

export class UnitsGridSchema extends withSchema(UnitsGrid) {
  @type('number') readonly width: number;
  @type('number') readonly height: number;
  @type({ map: UnitSchema }) slots: MapSchema<UnitSchema>;

  setUnit(coords: Coords, unit: UnitSchema | undefined): UnitsGridSchema {
    if (!unit) {
      this.slots.delete(`${(coords.x + this.width * coords.y) | 0}`);
    } else {
      this.slots.set(`${(coords.x + this.width * coords.y) | 0}`, unit);
    }
    return this;
  }

  moveUnit(from: Coords, to: Coords): UnitsGridSchema {
    const fromUnit = this.getUnit(from) as UnitSchema;
    if (!fromUnit) return this;

    const toUnit = this.getUnit(to) as UnitSchema;
    this.setUnit(to, fromUnit);
    this.setUnit(from, toUnit);
    return this;
  }

  upgradeUnit(coords: Coords): UnitsGridSchema {
    const unit = this.getUnit(coords);
    if (!unit) {
      throw new Error(`Unit at coords ${coords.x},${coords.y} does not exist!`);
    }
    unit.stars++;
    return this;
  }

  removeUnits(coords: Coords[]): UnitsGridSchema {
    for (const coord of coords) {
      this.setUnit(coord, undefined);
    }
    return this;
  }

  clear() {
    for (let i = 0; i < this.size; i++) {
      this.slots.delete(`${i}`);
    }
  }
}
