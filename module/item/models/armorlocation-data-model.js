// @ts-check
import {ItemDataModel} from './item-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class ArmorlocationDataModel extends ItemDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            probWeight: new SchemaField({
                high: new NumberField({initial: 0}),
                mid: new NumberField({initial: 0}),
                low: new NumberField({initial: 0})
            })
        });
    }
}
