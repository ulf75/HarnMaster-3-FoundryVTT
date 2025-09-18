// @ts-check
import {invokeRitualRoll} from '../../macros';
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
        return this.item.system.diety;
    }
    /**
     * @type {number}
     */
    get EML() {
        return HM100Check((this.Skill(this.diety)?.EML ?? 0) - 5 * this.circle);
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
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            invokeRitualRoll(item?.uuid, fastforward, this.actor);
        });
    }
}
