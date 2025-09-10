import {ActorType, SkillType} from '../../hm3-types';
import {ItemProxy} from './item-proxy';

export class SkillProxy extends ItemProxy {
    get EML() {
        return this.ML - 5 * this.Penalty;
    }
    get ML() {
        return this._item.system.masteryLevel;
    }
    get Penalty() {
        return [SkillType.COMBAT, SkillType.PHYSICAL].includes(this.subtype) ? this.actorProxy.PP : this.actorProxy.UP;
    }
    get SB() {
        return this._item.system.skillBase.value;
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
