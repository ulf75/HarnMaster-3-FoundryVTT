// @ts-check
import {GearDataModel} from './gear-data-model';

const {ArrayField, BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class ArmorDataModel extends GearDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            armorQuality: new NumberField({initial: 0, integer: true, min: -4, max: 4}),
            locations: new ArrayField(new StringField()),
            material: new StringField(),
            protection: new SchemaField({
                blunt: new NumberField({initial: 1, positive: true, integer: true, min: 1}),
                fire: new NumberField({initial: 1, positive: true, integer: true, min: 1}),
                edged: new NumberField({initial: 1, positive: true, integer: true, min: 1}),
                piercing: new NumberField({initial: 1, positive: true, integer: true, min: 1})
            }),
            size: new NumberField({initial: 6, integer: true, positive: true, min: 1, max: 20}),
            targetLocation: new StringField()
        });
    }

    /**
     * @type {number}
     */
    get AQ() {
        // @ts-expect-error
        return this.armorQuality;
    }
}
