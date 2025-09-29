// @ts-check
import {ContainerItemType} from '../../hm3-types';
import {GearDataModel} from './gear-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class ContainerDataModel extends GearDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            capacity: new SchemaField({
                max: new NumberField({initial: 0}),
                value: new NumberField({initial: 0})
            }),
            collapsed: new BooleanField({initial: false}),
            locked: new BooleanField({initial: false}),
            type: new StringField({initial: ContainerItemType.CONTAINER})
        });
    }
}
