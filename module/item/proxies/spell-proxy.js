// @ts-check
import {castSpellRoll} from '../../macros';
import {HM100Check} from '../../utility';
import {ItemProxy} from './item-proxy';

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
     * @type {number}
     */
    get EML() {
        return HM100Check((this.Skill(this.convocation)?.EML ?? 0) - 5 * this.level);
    }
    /**
     * @type {number}
     */
    get level() {
        return this.item.system.level;
    }
    get convocations() {
        const convocations = [];
        if (this.actor) {
            this.actorProxy.itemTypes.skill.forEach((item) => {
                if (item.subtype === 'Magic') convocations.push(item.name);
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
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            castSpellRoll(item?.uuid, fastforward, this.actor);
        });
    }
}
