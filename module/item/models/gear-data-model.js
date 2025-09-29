// @ts-check
import {truncate} from '../../utility';
import {ItemDataModel} from './item-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class GearDataModel extends ItemDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            container: new StringField({initial: ''}),
            isCarried: new BooleanField({initial: true}),
            isEquipped: new BooleanField({initial: true}),
            quantity: new NumberField({initial: 1}),
            value: new NumberField({initial: 0}),
            weight: new NumberField({initial: 0})
        });
    }

    /**
     * @type {boolean}
     */
    get hasValue() {
        return true;
    }

    /**
     * @type {number}
     */
    get weightT() {
        return truncate(this.weight, 3);
    }
}
