// @ts-check
import {skillRoll} from '../../macros';
import {SkillProxy} from './skill-proxy';

export class RidingSkillProxy extends SkillProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-riding';
    }
    /**
     * @type {string}
     */
    get actorUuid() {
        return this.item.system.actorUuid;
    }
    /**
     * @type {boolean}
     */
    get isRiding() {
        return true;
    }
    /**
     * @type {boolean}
     */
    get mounted() {
        return this.actor.mounted;
    }
    /**
     * @type {{key: string, label: string}[]}
     */
    get steeds() {
        const steeds = this.actor.getSteeds();
        return [
            {key: '', label: `No Steed`},
            ...steeds.map((steed) => {
                if (steed) return {key: steed.uuid, label: steed.name};
            })
        ];
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.off('click', `.${this.cls}-roll`);
        html.on('click', `.${this.cls}-roll`, (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            skillRoll(item?.uuid, fastforward, this.actor);
        });
    }
}
