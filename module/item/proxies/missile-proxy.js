import {HM100Check} from '../../utility';
import {GearProxy} from './gear-proxy';

export class MissileProxy extends GearProxy {
    get AML() {
        return HM100Check(this.Skill(this.assocSkill).EML);
    }
    get assocSkill() {
        return this._item.system.assocSkill;
    }
    get isFeet() {
        return game.settings.get('hm3', 'distanceUnits') !== 'grid';
    }

    get short() {
        return {
            range: this.isFeet
                ? this._item.system.range.short
                : this._item.system.range.short / canvas.dimensions.distance,
            impact: this._item.system.impact.short
        };
    }

    get medium() {
        return {
            range: this.isFeet
                ? this._item.system.range.medium
                : this._item.system.range.medium / canvas.dimensions.distance,
            impact: this._item.system.impact.medium
        };
    }

    get long() {
        return {
            range: this.isFeet
                ? this._item.system.range.long
                : this._item.system.range.long / canvas.dimensions.distance,
            impact: this._item.system.impact.long
        };
    }

    get extreme() {
        return {
            range: this.isFeet
                ? this._item.system.range.extreme
                : this._item.system.range.extreme / canvas.dimensions.distance,
            impact: this._item.system.impact.extreme
        };
    }
}
