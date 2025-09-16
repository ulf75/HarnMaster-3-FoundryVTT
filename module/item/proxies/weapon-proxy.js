import {HM100Check} from '../../utility';
import {GearProxy} from './gear-proxy';

export class WeaponProxy extends GearProxy {
    get cls() {
        return super.cls + '-weapon';
    }
    get AML() {
        return HM100Check(this.Skill(this.assocSkill)?.EML ?? 0 + this.attack);
    }
    get assocSkill() {
        return this._item.system.assocSkill;
    }
    get attack() {
        return this._item.system.attack ?? 0;
    }
    get attackModifier() {
        return this._item.system.attackModifier ?? 0;
    }
    get blunt() {
        return this._item.system.blunt;
    }
    get defense() {
        return this._item.system.defense ?? 0;
    }
    get DML() {
        return HM100Check(this.Skill(this.assocSkill)?.EML ?? 0 + this.defense);
    }
    get edged() {
        return this._item.system.edged;
    }
    get piercing() {
        return this._item.system.piercing;
    }
    get WQ() {
        return this._item.system.weaponQuality;
    }
    get wqModifier() {
        return this._item.system.wqModifier ?? 0;
    }
    get wqTotal() {
        return this.WQ + this.wqModifier;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
