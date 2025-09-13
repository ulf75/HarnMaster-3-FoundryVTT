import {HM100Check} from '../../utility';
import {ItemProxy} from './item-proxy';

export class InvocationProxy extends ItemProxy {
    get circle() {
        return this._item.system.circle;
    }
    get diety() {
        return this._item.system.diety;
    }
    get EML() {
        return HM100Check(this.Skill(this.diety).EML - 5 * this.circle);
    }
}
