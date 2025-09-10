import {GearProxy} from './gear-proxy';

export class MissileProxy extends GearProxy {
    get isFeet() {
        return game.settings.get('hm3', 'distanceUnits') !== 'grid';
    }

    get short() {
        return this.isFeet ? this._item.system.range.short : this._item.system.range.short / canvas.dimensions.distance;
    }

    get shortImpact() {
        return this._item.system.impact.short;
    }

    get medium() {
        return this.isFeet
            ? this._item.system.range.medium
            : this._item.system.range.medium / canvas.dimensions.distance;
    }

    get mediumImpact() {
        return this._item.system.impact.medium;
    }

    get long() {
        return this.isFeet ? this._item.system.range.long : this._item.system.range.long / canvas.dimensions.distance;
    }

    get longImpact() {
        return this._item.system.impact.long;
    }

    get extreme() {
        return this.isFeet
            ? this._item.system.range.extreme
            : this._item.system.range.extreme / canvas.dimensions.distance;
    }

    get extremeImpact() {
        return this._item.system.impact.extreme;
    }
}
