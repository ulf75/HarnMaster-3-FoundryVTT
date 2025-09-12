import {SkillProxy} from './skill-proxy';

export class PsionicProxy extends SkillProxy {
    get fatigue() {
        return this._item.system.fatigue;
    }
    get visible() {
        return !game.settings.get('hm3', 'dormantPsionicTalents') || this.ML > 20 || this.EML > 20 || game.user.isGM;
    }
}
