// @ts-check
import {HM100Check} from '../../utility';
import {GearDataModel} from './gear-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class WeaponDataModel extends GearDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            assocSkill: new StringField({}),
            attack: new NumberField({initial: 0, integer: true, min: 0}),
            attackModifier: new NumberField({initial: 0, integer: true}), // Hand Mode (HM)
            blunt: new NumberField({initial: 0, integer: true, min: -1}),
            defense: new NumberField({initial: 0, integer: true}),
            edged: new NumberField({initial: 0, integer: true, min: -1}),
            piercing: new NumberField({initial: 0, integer: true, min: -1}),
            weaponQuality: new NumberField({initial: 0, integer: true, min: 0}),
            wqModifier: new NumberField({initial: 0, integer: true, min: -4, max: 4})
        });
    }

    /**
     * @type {number}
     */
    get AML() {
        // @ts-expect-error
        return HM100Check(this.SML + this.attack + this.attackModifier);
    }
    /**
     * @type {number}
     */
    get DML() {
        // @ts-expect-error
        return HM100Check(this.SML + this.defense);
    }
    /**
     * @type {number}
     */
    get HM() {
        // @ts-expect-error
        return this.attackModifier;
    }
    /**
     * @type {boolean}
     */
    get isUnarmed() {
        // @ts-expect-error
        return this.assocSkill.toLowerCase().includes('unarmed');
    }
    /**
     * @type {boolean}
     */
    get isShield() {
        // @ts-expect-error
        return this.isEquipped && /shield|\bbuckler\b/i.test(this.item.name);
    }
    /**
     * Skill Mastery Level
     * @type {number}
     */
    get SML() {
        // @ts-expect-error
        return this.Skill(this.assocSkill)?.EML ?? 0;
    }
    /**
     * @type {number}
     */
    get wqTotal() {
        // @ts-expect-error
        return this.weaponQuality + this.wqModifier;
    }
}
