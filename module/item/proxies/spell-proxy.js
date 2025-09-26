// @ts-check
import {SkillType} from '../../hm3-types';
import {castSpellRollv2} from '../../macros';
import {HM100Check} from '../../utility';
import {ItemProxy} from './item-proxy';

/**
 * @class
 * @extends ItemProxy
 */
export class SpellProxy extends ItemProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-spell';
    }
    /**
     * @type {string}
     */
    get convocation() {
        return this.item.system.convocation;
    }
    /**
     * Convocation Skill Index (RSI)
     * @type {number}
     */
    get CSI() {
        return this.SI;
    }
    /**
     * @summary Spell Effective Mastery Level (EML)
     * @description ```EML = Convocation EML - 5 * Spell Level```
     * @type {number}
     */
    get EML() {
        return HM100Check((this.Skill(this.convocation)?.EML ?? 0) - 5 * this.level);
    }
    /**
     * Spell Level
     * @type {number}
     */
    get level() {
        return this.item.system.level;
    }
    /**
     * Convocation Mastery Level (ML)
     * @type {number}
     */
    get ML() {
        return HM100Check(this.Skill(this.convocation)?.ML ?? 0);
    }
    /**
     * Convocation Skill Base (SB)
     * @type {{value: number, formula: string, isFormulaValid: boolean, delta: number} | null}
     */
    get SB() {
        return this.Skill(this.convocation)?.SB ?? null;
    }
    /**
     * Convocation Skill Index (CSI)
     * @type {number}
     */
    get SI() {
        return this.Skill(this.convocation)?.SI ?? -1;
    }

    /**
     * @type {string[]}
     */
    get convocations() {
        const convocations = [];
        if (this.aproxy) {
            this.aproxy.itemTypes.skill.forEach((item) => {
                if (item.subtype === SkillType.MAGIC) convocations.push(item.name);
            });
        }
        return convocations;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.off('click', '.spell-roll');
        html.on('click', '.spell-roll', (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor?.items.get(li.data('itemId'));
            castSpellRollv2(item?.uuid, ev.shiftKey || ev.altKey || ev.ctrlKey, this.actor);
        });
    }
}
