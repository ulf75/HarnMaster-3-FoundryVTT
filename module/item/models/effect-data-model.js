// @ts-check
import {GearDataModel} from './gear-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class EffectDataModel extends GearDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {});
    }

    /**
     * @type {boolean}
     * @override
     */
    get visible() {
        // @ts-expect-error
        return game.user?.isGM;
    }
}
