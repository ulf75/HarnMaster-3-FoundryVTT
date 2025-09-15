import {ActorType, SkillType} from '../../hm3-types';
import {skillRoll} from '../../macros';
import {HM100Check} from '../../utility';
import {ItemProxy} from './item-proxy';

export class SkillProxy extends ItemProxy {
    get cls() {
        return super.cls + '-skill';
    }
    get EML() {
        return HM100Check(this.ML - 5 * this.penalty);
    }
    get improveFlag() {
        return this._item.system.improveFlag;
    }
    get ML() {
        return this._item.system.masteryLevel;
    }
    get OP() {
        return this._item.system.skillBase.OP;
    }
    get penalty() {
        return [SkillType.COMBAT, SkillType.PHYSICAL].includes(this.subtype) ? this.actorProxy.PP : this.actorProxy.UP;
    }
    get SB() {
        return this._item.system.skillBase.value;
    }
    get SBx() {
        return this._item.system.skillBase.SBx;
    }
    get SI() {
        return Math.floor(this.ML / 10);
    }

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

    /** @override */
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
                    if (skillName.toLowerCase().includes(lcSkillNameFilter)) {
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
