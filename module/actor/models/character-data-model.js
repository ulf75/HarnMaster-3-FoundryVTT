// @ts-check
import {LivingDataModel} from './living-data-model';

const {ArrayField, BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
/**
 *
 */
export class CharacterDataModel extends LivingDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            culture: new StringField({}),
            frame: new StringField({initial: 'Medium', choices: ['Scant', 'Light', 'Medium', 'Heavy', 'Massive']}),
            height: new NumberField({initial: 1, integer: true, positve: true}),
            occupation: new StringField({}),
            socialClass: new StringField({}),
            species: new StringField({initial: 'Human'}),
            sunsign: new StringField({initial: 'None'}),
            weight: new NumberField({initial: 1, integer: true, positive: true})
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();
    }
}
