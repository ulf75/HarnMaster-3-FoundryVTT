import {castSpellRoll} from '../../macros';
import {HM100Check} from '../../utility';
import {ItemProxy} from './item-proxy';

export class SpellProxy extends ItemProxy {
    get cls() {
        return super.cls + '-spell';
    }
    get convocation() {
        return this._item.system.convocation;
    }
    get EML() {
        return HM100Check(this.Skill(this.convocation).EML - 5 * this.level);
    }
    get level() {
        return this._item.system.level;
    }

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
