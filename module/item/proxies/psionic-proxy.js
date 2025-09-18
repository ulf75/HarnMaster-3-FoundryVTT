// @ts-check
import {usePsionicRoll} from '../../macros';
import {SkillProxy} from './skill-proxy';

export class PsionicProxy extends SkillProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-psionic';
    }
    /**
     * @type {number}
     */
    get fatigue() {
        return this.item.system.fatigue;
    }
    /**
     * @type {boolean}
     * @override
     */
    get visible() {
        // @ts-expect-error
        return !game.settings.get('hm3', 'dormantPsionicTalents') || this.ML > 20 || this.EML > 20 || game.user.isGM;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.off('click', '.psionic-roll');
        html.on('click', '.psionic-roll', (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            usePsionicRoll(item?.uuid, fastforward, this.actor);
        });
    }
}
