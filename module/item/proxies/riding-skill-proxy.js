import {skillRoll} from '../../macros';
import {SkillProxy} from './skill-proxy';

export class RidingSkillProxy extends SkillProxy {
    get cls() {
        return super.cls + '-riding';
    }
    get actorUuid() {
        return this._item.system.actorUuid;
    }

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
