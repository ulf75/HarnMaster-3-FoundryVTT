import {HM100Check} from '../../utility';
import {GearProxy} from './gear-proxy';

export class WeaponProxy extends GearProxy {
    /**
     * @type {string}
     */
    get cls() {
        return super.cls + '-weapon';
    }
    /**
     * @type {number}
     */
    get AML() {
        return HM100Check(this.SML + this.attack + this.attackModifier + this.AMLEffect + this.AMLItemEffect);
    }
    /**
     * @type {string}
     */
    get assocSkill() {
        return this.item.system.assocSkill;
    }
    /**
     * @type {number}
     */
    get attack() {
        return this.item.system.attack ?? 0;
    }
    /**
     * @type {number}
     */
    get attackModifier() {
        return this.item.system.attackModifier ?? 0;
    }
    /**
     * @type {number}
     */
    get blunt() {
        return this.item.system.blunt;
    }
    /**
     * @type {number}
     */
    get defense() {
        return this.item.system.defense ?? 0;
    }
    /**
     * @type {number}
     */
    get DML() {
        return HM100Check(this.SML + this.defense + this.DMLEffect + this.DMLItemEffect);
    }
    /**
     * @type {number}
     */
    get edged() {
        return this.item.system.edged;
    }
    /**
     * @type {number}
     */
    get piercing() {
        return this.item.system.piercing;
    }
    /**
     * Skill Mastery Level
     * @type {number}
     */
    get SML() {
        return this.Skill(this.assocSkill)?.EML ?? 0;
    }
    /**
     * @type {number}
     */
    get WQ() {
        return this.item.system.weaponQuality;
    }
    /**
     * @type {number}
     */
    get wqModifier() {
        return this.item.system.wqModifier ?? 0;
    }
    /**
     * @type {number}
     */
    get wqTotal() {
        return this.WQ + this.wqModifier;
    }

    //
    // Derived
    //

    /**
     * @type {boolean}
     */
    get isUnarmed() {
        return this.assocSkill.toLowerCase().includes('unarmed');
    }
    /**
     * @type {boolean}
     */
    get isShield() {
        return this.isEquipped && /shield|\bbuckler\b/i.test(this.name);
    }
    /**
     * @type {number}
     */
    get AMLEffect() {
        return this.actor.system.v2.meleeAMLMod ?? 0;
    }
    /**
     * @type {number}
     */
    get DMLEffect() {
        return this.actor.system.v2.meleeDMLMod ?? 0;
    }
    /**
     * @type {number}
     */
    get AMLItemEffect() {
        return this.actor.system.v2.attackMasteryLevel ?? 0;
    }
    /**
     * @type {number}
     */
    get DMLItemEffect() {
        return this.actor.system.v2.defenseMasteryLevel ?? 0;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
