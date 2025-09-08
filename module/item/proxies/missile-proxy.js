import {GearProxy} from './gear-proxy';

export class MissileProxy extends GearProxy {
    get isGridDistanceUnits() {
        return game.settings.get('hm3', 'distanceUnits') === 'grid';
    }

    get short() {
        return this._item.system.range.short;
    }

    get medium() {
        return this._item.system.range.medium;
    }

    get long() {
        return this._item.system.range.long;
    }

    get extreme() {
        return this._item.system.range.extreme;
    }

    get rangeGrid() {
        return {
            short: this.short / canvas.dimensions.distance,
            medium: this.medium / canvas.dimensions.distance,
            long: this.long / canvas.dimensions.distance,
            extreme: this.extreme / canvas.dimensions.distance
        };
    }
}
