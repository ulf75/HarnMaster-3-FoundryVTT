// @ts-check
import {InjuryType} from '../../hm3-types';
import {ItemDataModel} from './item-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class InjuryDataModel extends ItemDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            aspect: new StringField({initial: ''}),
            healRate: new NumberField({initial: 5, min: 0, max: 7}),
            injuryLevel: new NumberField({initial: 1, positive: true, min: 1, max: 5}),
            type: new StringField({initial: InjuryType.HEALING})
        });
    }

    /**
     * @type {number}
     */
    get HR() {
        // @ts-expect-error
        return this.healRate;
    }
    /**
     * @type {number}
     */
    get IL() {
        // @ts-expect-error
        return this.injuryLevel;
    }
    /**
     * @type {string}
     */
    get label() {
        return this.HR !== undefined ? (this.HR === 0 ? `Treatment Roll` : `Healing Roll`) : '';
    }
    /**
     * @type {string}
     */
    get severity() {
        const sev = this.IL >= 4 ? 'G' : this.IL >= 2 ? 'S' : 'M';
        return `${sev}${this.IL}`;
    }
}
