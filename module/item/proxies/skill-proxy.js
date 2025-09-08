import {SkillType} from '../../hm3-types';
import {ItemProxy} from './item-proxy';

export class SkillProxy extends ItemProxy {
    get ML() {
        return this._item.system.masteryLevel;
    }

    get SB() {
        return this._item.system.skillBase;
    }

    get Penalty() {
        return [SkillType.COMBAT, SkillType.PHYSICAL].includes(this.subtype)
            ? this.actor.derived.PP
            : this.actor.derived.UP;
    }

    get EML() {
        return this.ML - 5 * this.Penalty;
    }
}
