// @ts-check
import {LivingDataModel} from './living-data-model';

const {ArrayField, BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
/**
 *
 */
export class CreatureDataModel extends LivingDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {});
    }

    /**
     * @type {number}
     * @override
     */
    get damageDie() {
        // @ts-expect-error
        return this.size;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();
    }
}
