// @ts-check
import {GearDataModel} from './gear-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class MissileDataModel extends GearDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            assocSkill: new StringField({}),
            impact: new SchemaField({
                short: new NumberField({initial: 0, integer: true}),
                medium: new NumberField({initial: 0}),
                long: new NumberField({initial: 0}),
                extreme: new NumberField({initial: 0})
            }),
            range: new SchemaField({
                short: new NumberField({initial: 0}),
                medium: new NumberField({initial: 0}),
                long: new NumberField({initial: 0}),
                extreme: new NumberField({initial: 0})
            }),
            weaponAspect: new StringField({}),
            weaponQuality: new NumberField({initial: 0, integer: true})
        });
    }

    /**
     * @type {boolean}
     */
    get isFeet() {
        // @ts-expect-error
        return game.settings?.get('hm3', 'distanceUnits') !== 'grid';
    }
}
