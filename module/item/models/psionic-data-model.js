// @ts-check
import {SkillDataModel} from './skill-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class PsionicDataModel extends SkillDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            fatigue: new NumberField({initial: 0})
        });
    }

    /**
     * @type {boolean}
     * @override
     */
    get visible() {
        // @ts-expect-error
        return !game.settings?.get('hm3', 'dormantPsionicTalents') || this.ML > 20 || this.EML > 20 || game.user?.isGM;
    }
}
