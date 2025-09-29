// @ts-check
import {SkillType} from '../../hm3-types';
import {invokeRitualRollv2} from '../../macros';
import {HM100Check} from '../../utility';
import {ItemProxy} from './item-proxy';

export class InvocationProxy extends ItemProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-invocation';
    }
    /**
     * @type {number}
     */
    get circle() {
        return this.item.system.circle;
    }
    /**
     * @type {string}
     */
    get diety() {
        // @ts-expect-error
        return this.item.system.diety;
    }
    /**
     * Effective Ritual Mastery Level (EML)
     * @type {number}
     */
    get EML() {
        return HM100Check((this.Skill(this.diety)?.EML ?? 0) - 5 * this.circle);
    }
    /**
     * Ritual Mastery Level (ML)
     * @type {number}
     */
    get ML() {
        return HM100Check(this.Skill(this.diety)?.ML ?? 0);
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
        return this.Skill(this.diety)?.SB ?? null;
    }
    /**
     * Ritual Skill Index (RSI)
     * @type {number}
     */
    get SI() {
        return this.Skill(this.diety)?.SI ?? -1;
    }

    /**
     * @type {string[]}
     */
    get deities() {
        const deities = [];
        if (this.aproxy) {
            this.aproxy.itemTypes.skill.forEach((item) => {
                // @ts-expect-error
                if (item.subtype === SkillType.RITUAL) deities.push(item.name);
            });
        }
        return deities;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.off('click', '.invocation-roll');
        html.on('click', '.invocation-roll', (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            invokeRitualRollv2(item?.uuid, ev.shiftKey || ev.altKey || ev.ctrlKey, this.actor);
        });
    }
}
