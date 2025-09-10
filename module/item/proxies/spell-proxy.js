import {ItemProxy} from './item-proxy';

export class SpellProxy extends ItemProxy {
    get convocation() {
        return this._item.system.convocation;
    }
    get EML() {
        return this.HM100Check(this.Skill(this.convocation).EML - 5 * this.level);
    }
    get level() {
        return this._item.system.level;
    }
}
