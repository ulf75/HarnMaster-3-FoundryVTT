import {SkillProxy} from './skill-proxy';

export class RidingSkillProxy extends SkillProxy {
    get actorUuid() {
        return this._item.system.actorUuid;
    }
}
