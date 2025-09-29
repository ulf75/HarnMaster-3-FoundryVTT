// @ts-check
import {ItemDataModel} from './item-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class TraitDataModel extends ItemDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            severity: new StringField({initial: '5'})
        });
    }
}
