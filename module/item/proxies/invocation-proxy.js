import {invokeRitualRoll} from '../../macros';
import {HM100Check} from '../../utility';
import {ItemProxy} from './item-proxy';

export class InvocationProxy extends ItemProxy {
    get cls() {
        return super.cls + '-invocation';
    }
    get circle() {
        return this._item.system.circle;
    }
    get diety() {
        return this._item.system.diety;
    }
    get EML() {
        return HM100Check(this.Skill(this.diety).EML - 5 * this.circle);
    }

    activateListeners(html) {
        html.find('.invocation-roll').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            invokeRitualRoll(item?.uuid, fastforward, this.actor);
        });
    }
}
