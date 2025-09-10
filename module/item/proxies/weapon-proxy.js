import {GearProxy} from './gear-proxy';

export class WeaponProxy extends GearProxy {
    get AML() {
        return this.HM100Check(this.Skill(this.assocSkill).EML + this.attack);
    }
    get assocSkill() {
        return this._item.system.assocSkill;
    }
    get attack() {
        return this._item.system.attack;
    }
    get attackModifier() {
        return this._item.system.attackModifier;
    }
    get blunt() {
        return this._item.system.blunt;
    }
    get defense() {
        return this._item.system.defense;
    }
    get DML() {
        return this.HM100Check(this.Skill(this.assocSkill).EML + this.defense);
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
        return this._item.system.wqModifier || 0;
    }
    get wqTotal() {
        return this.WQ + this.wqModifier;
    }
}
