// @ts-check
import {ActorDataModel} from './actor-data-model';

const {ArrayField, BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
/**
 *
 */
export class CreatureDataModel extends ActorDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            value: new NumberField({initial: 0, min: 0}),
            weight: new NumberField({initial: 0, min: 0})
        });
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
