// @ts-check
import {GearDataModel} from './gear-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class WeaponDataModel extends GearDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            assocSkill: new StringField({}),
            attack: new NumberField({initial: 0, integer: true}),
            attackModifier: new NumberField({initial: 0, integer: true}),
            blunt: new NumberField({initial: 0, integer: true}),
            defense: new NumberField({initial: 0, integer: true}),
            edged: new NumberField({initial: 0, integer: true}),
            piercing: new NumberField({initial: 0, integer: true}),
            weaponQuality: new NumberField({initial: 0, integer: true}),
            wqModifier: new NumberField({initial: 0, integer: true})
        });
    }

    /**
     * @type {number}
     */
    get wqTotal() {
        return this.weaponQuality + this.wqModifier;
    }
}
