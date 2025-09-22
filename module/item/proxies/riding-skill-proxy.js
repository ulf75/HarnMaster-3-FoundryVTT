// @ts-check
import {skillRollAlt} from '../../macros';
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
    get actorName() {
        return fromUuidSync(this.item.system.actorUuid)?.name ?? 'Unknown';
    }
    /**
     * @type {string}
     */
    get actorUuid() {
        return this.item.system.actorUuid;
    }
    /**
     * @type {string}
     */
    get defaultImg() {
        return new Map(this.config.combatSkillIcons).get('riding');
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
        return this.actorProxy.mounted;
    }
    /**
     * @type {{key: string, label: string}[]}
     */
    get steeds() {
        const steeds = this.actor.getSteeds();
        return [
            {key: '', label: `No Steed`},
            ...steeds.map((steed) => {
                return {key: steed.uuid, label: steed.name};
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
            const noDialog = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const item = this.actor.items.get(li.data('itemId'));
            skillRollAlt({itemUuid: item?.uuid, noDialog});
        });

        html.off('change', '.system-actor-uuid');
        html.on('change', '.system-actor-uuid', async (ev) => {
            const result = await ev.result;
            const ridingImg = this.defaultImg;
            // Steed linked to Riding skill according to COMBAT 20
            if (!!result['system.actorUuid'] && result.img === ridingImg) {
                /** @type {Actor | null} */
                const steed = fromUuidSync(this.actorUuid);
                if (steed) {
                    this.item.img = steed.img;
                    this.item.name += '/' + steed.name;
                    this.item.update({'img': this.item.img, 'name': this.item.name});
                    steed.update({'system.ownerUuid': this.item.actor.uuid});
                }
            } else if (!result['system.actorUuid'] && result.img !== ridingImg) {
                this.item.img = ridingImg;
                this.item.name = 'Riding';
                this.item.update({'img': this.item.img, 'name': this.item.name});
                this.item.actor.update({'system.mounted': false});
            }
        });
    }
}
