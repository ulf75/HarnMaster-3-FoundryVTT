// @ts-check
import {ArcaneType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ItemDataModel} from './item-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
/**
 * @abstract
 */
export class GearDataModel extends ItemDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            arcane: new SchemaField({
                charges: new NumberField({initial: -1, integer: true, min: -1}),
                ego: new NumberField({initial: 0, integer: true, min: 0, max: 18}),
                isAttuned: new BooleanField({initial: false}),
                isOwnerAware: new BooleanField({initial: false}),
                major: new SchemaField({
                    power1: new StringField({}),
                    power2: new StringField({}),
                    power3: new StringField({}),
                    power4: new StringField({}),
                    power5: new StringField({})
                }),
                minor: new StringField({}),
                morality: new NumberField({initial: -1, integer: true, min: -1, max: 18}),
                naturalPersonality: new BooleanField({initial: false}),
                needsAttunement: new BooleanField({initial: false}),
                type: new StringField({initial: ArcaneType.MINOR})
            }),
            container: new StringField({initial: ''}),
            isCarried: new BooleanField({initial: true}),
            isEquipped: new BooleanField({initial: true}),
            quantity: new NumberField({initial: 1, min: 0, integer: true}),
            value: new NumberField({initial: 0, min: 0}),
            weight: new NumberField({initial: 0, min: 0})
        });
    }

    /**
     * @type {boolean}
     * @override
     */
    get hasValue() {
        return true;
    }

    /**
     * @type {number}
     */
    get weightT() {
        // @ts-expect-error
        return truncate(this.weight, 3);
    }
}
