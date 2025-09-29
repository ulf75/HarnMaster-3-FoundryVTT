// @ts-check
import {SkillType} from '../../hm3-types';
import {HM100Check} from '../../utility';
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

    /**
     * @type {string}
     */
    get deity() {
        // @ts-expect-error
        return this.diety;
    }
    /**
     * Effective Ritual Mastery Level (EML)
     * @type {number}
     */
    get EML() {
        // @ts-expect-error
        return HM100Check((this.Skill(this.deity)?.EML ?? 0) - 5 * this.circle);
    }
    /**
     * Ritual Mastery Level (ML)
     * @type {number}
     */
    get ML() {
        // @ts-expect-error
        return HM100Check(this.Skill(this.deity)?.ML ?? 0);
    }
    /**
     * Ritual Skill Index (RSI)
     * @type {number}
     */
    get RSI() {
        return this.SI;
    }
    /**
     * Ritual Skill Base (SB)
     * @type {{value: number, formula: string, isFormulaValid: boolean, delta: number} | null}
     */
    get SB() {
        // @ts-expect-error
        return this.Skill(this.deity)?.SB ?? null;
    }
    /**
     * Ritual Skill Index (RSI)
     * @type {number}
     */
    get SI() {
        // @ts-expect-error
        return this.Skill(this.deity)?.SI ?? -1;
    }

    /**
     * @type {string[]}
     */
    get deities() {
        const deities = [];
        if (this.actor) {
            // @ts-expect-error
            this.actor.itemTypes.skill.forEach((item) => {
                if (item.subtype === SkillType.RITUAL) deities.push(item.name);
            });
        }
        return deities;
    }
}
