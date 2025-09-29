// @ts-check
import {ItemDataModel} from './item-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class InvocationDataModel extends ItemDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            circle: new NumberField({initial: 0}),
            diety: new StringField({initial: ''})
        });
    }
}
