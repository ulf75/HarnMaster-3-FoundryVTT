// @ts-check
import {MiscItemType} from '../../hm3-types';
import {GearDataModel} from './gear-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class MiscgearDataModel extends GearDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            type: new StringField({initial: MiscItemType.MISC})
        });
    }
}
