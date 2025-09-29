// @ts-check
import {GearDataModel} from './gear-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class ArmorDataModel extends GearDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {});
    }
}
