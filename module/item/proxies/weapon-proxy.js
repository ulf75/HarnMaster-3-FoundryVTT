import {GearProxy} from './gear-proxy';

export class WeaponProxy extends GearProxy {
    get WQ() {
        return this._item.system.weaponQuality;
    }

    get wqModifier() {
        return this._item.system.wqModifier || 0;
    }

    get wqTotal() {
        return this.WQ + this.wqModifier;
    }

    get blunt() {
        return this._item.system.blunt;
    }
    get edged() {
        return this._item.system.edged;
    }
    get piercing() {
        return this._item.system.piercing;
    }
    get attack() {
        return this._item.system.attack;
    }
    get defense() {
        return this._item.system.defense;
    }
    get attackModifier() {
        return this._item.system.attackModifier;
    }
    get assocSkill() {
        return this._item.system.assocSkill;
    }
    get AML() {
        return this.actor.proxies.find((item) => item.name === this.assocSkill).EML + this.attack;
    }
    get DML() {
        return this.actor.proxies.find((item) => item.name === this.assocSkill).EML + this.defense;
    }
}
