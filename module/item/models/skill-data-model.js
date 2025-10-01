// @ts-check
import {SkillType} from '../../hm3-types';
import {HM100Check, truncatedOML} from '../../utility';
import {ItemDataModel} from './item-data-model';

const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class SkillDataModel extends ItemDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            improveFlag: new NumberField({initial: 0}),
            masteryLevel: new NumberField({initial: 0}),
            skillBase: new SchemaField({
                delta: new NumberField({initial: 0}),
                formula: new StringField({initial: ''}),
                isFormulaValid: new BooleanField({initial: false}),
                OP: new NumberField({initial: 0}),
                SBx: new NumberField({initial: 1}),
                value: new NumberField({initial: 0})
            })
        });
    }

    /**
     * @type {number}
     */
    get EML() {
        return HM100Check(this.ML - 5 * this.penalty);
    }
    /**
     * @type {number}
     */
    get ML() {
        // @ts-expect-error
        return this.masteryLevel || this.OML;
    }
    /**
     * @type {number}
     */
    get OML() {
        return truncatedOML((this.SBx + Math.round(this.OP / 2)) * this.SB);
    }
    /**
     * @type {number}
     */
    get OP() {
        // @ts-expect-error
        return this.skillBase.OP;
    }
    /**
     * @type {number}
     */
    get penalty() {
        return [SkillType.COMBAT, SkillType.PHYSICAL].includes(this.subtype)
            ? this.actor?.system.PP
            : this.actor?.system.UP;
    }
    /**
     * @type {number}
     */
    get SB() {
        // @ts-expect-error
        return this.skillBase.value;
    }
    /**
     * @type {number}
     */
    get SBx() {
        // @ts-expect-error
        return this.skillBase.SBx;
    }
    /**
     * @type {number}
     */
    get SI() {
        return Math.floor(this.ML / 10);
    }
}
