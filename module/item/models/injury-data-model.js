// @ts-check
import {InjuryType} from '../../hm3-types';
import {ItemDataModel} from './item-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class InjuryDataModel extends ItemDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            aspect: new StringField(),
            healRate: new NumberField({}),
            injuryLevel: new NumberField({}),
            type: new StringField({initial: InjuryType.HEALING})
        });
    }

    /**
     * @type {string}
     */
    get severity() {
        const sev = this.injuryLevel >= 4 ? 'G' : this.injuryLevel >= 2 ? 'S' : 'M';
        return `${sev}${this.injuryLevel}`;
    }
}
