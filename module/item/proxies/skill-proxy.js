// @ts-check
import {ActorType, SkillType} from '../../hm3-types';
import {skillRoll} from '../../macros';
import {HM100Check, truncatedOML} from '../../utility';
import {ItemProxy} from './item-proxy';

export class SkillProxy extends ItemProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-skill';
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
    get improveFlag() {
        return this.item.system.improveFlag;
    }
    /**
     * @type {number}
     */
    get ML() {
        return this.item.system.masteryLevel;
    }
    /**
     * @type {number}
     */
    get OML() {
        return truncatedOML(this.SBx * this.SB.value);
    }
    /**
     * @type {number}
     */
    get OP() {
        return this.item.system.skillBase.OP;
    }
    /**
     * @type {number}
     */
    get penalty() {
        return [SkillType.COMBAT, SkillType.PHYSICAL].includes(this.subtype) ? this.actorProxy.PP : this.actorProxy.UP;
    }
    /**
     * @type {{value: number, formula: number, isFormulaValid: boolean, delta: number}}
     */
    get SB() {
        return this.item.system.skillBase;
    }
    /**
     * @type {number}
     */
    get SBx() {
        return this.item.system.skillBase.SBx;
    }
    /**
     * @type {number}
     */
    get SI() {
        return Math.floor(this.ML / 10);
    }

    /**
     * @type {boolean}
     */
    get isSkillImprovement() {
        // some special rules
        if (this.actor.type === ActorType.CREATURE && this.actor.system.species.toLowerCase().includes('dog')) {
            // With the exception of Awareness, dog skills may be improved by training and practice. (DOGS 2)
            if (this.name === 'Awareness') {
                return false;
            }
        }
        return this.actor.skillImprovement;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.off('keyup', '.skill-name-filter');
        html.on('keyup', '.skill-name-filter', (ev) => {
            this.skillNameFilter = $(ev.currentTarget).val();
            const lcSkillNameFilter = this.skillNameFilter.toLowerCase();
            let skills = html.find('.skill-item');
            for (let skill of skills) {
                const skillName = skill.getAttribute('data-item-name');
                if (lcSkillNameFilter) {
                    if (skillName && skillName.toLowerCase().includes(lcSkillNameFilter)) {
                        $(skill).show();
                    } else {
                        $(skill).hide();
                    }
                } else {
                    $(skill).show();
                }
            }
        });

        html.off('click', `.${this.cls}-roll`);
        html.on('click', `.${this.cls}-roll`, (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            skillRoll(item?.uuid, fastforward, this.actor);
        });
    }
}
