import {ActorType, SkillType} from '../../hm3-types';
import {ItemProxy} from './item-proxy';

export class SkillProxy extends ItemProxy {
    get EML() {
        return this.HM100Check(this.ML - 5 * this.penalty);
    }
    get improveFlag() {
        return this._item.system.improveFlag;
    }
    get ML() {
        return this._item.system.masteryLevel;
    }
    get OP() {
        return this._item.system.skillBase.OP;
    }
    get penalty() {
        return [SkillType.COMBAT, SkillType.PHYSICAL].includes(this.subtype) ? this.actorProxy.PP : this.actorProxy.UP;
    }
    get SB() {
        return this._item.system.skillBase.value;
    }
    get SBx() {
        return this._item.system.skillBase.SBx;
    }
    get SI() {
        return Math.floor(this.ML / 10);
    }

    get isSkillImprovement() {
        // some special rules
        if (this.actor.type === ActorType.CREATURE && this.actor.system.species.toLowerCase().includes('dog')) {
            // With the exception of Awareness, dog skills may be improved by training and practice. (DOGS 2)
            if (this.name === 'Awareness') {
                return false;
            }
        }
        return this.actor.skillImprovement;
    }
}
