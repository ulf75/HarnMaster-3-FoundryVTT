// @ts-check
import {CompanionType} from '../../hm3-types';
import {ItemProxy} from './item-proxy';

export class CompanionProxy extends ItemProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-companion';
    }
    /**
     * @type {string}
     */
    get actorUuid() {
        return this.item.system.actorUuid;
    }
    /**
     * @type {import('../../actor/actor').ActorHM3 | null}
     */
    get companion() {
        return fromUuidSync(this.actorUuid);
    }
    /**
     * @type {string}
     */
    get gender() {
        return this.companion?.system.gender ?? 'Male';
    }
    /**
     * @type {string}
     * @override
     */
    get img() {
        return this.companion?.img ?? '';
    }
    /**
     * @type {string}
     */
    get linkToActor() {
        return this.companion?.link;
    }
    /**
     * @type {string}
     * @override
     */
    get name() {
        return this.companion?.name ?? 'Unknown';
    }
    /**
     * @type {string}
     */
    get occupation() {
        return this.companion?.system.occupation ?? 'Unknown';
    }
    /**
     * @type {string}
     */
    get species() {
        return this.companion?.system.species ?? 'Unknown';
    }
    /**
     * @type {CompanionType}
     * @override
     */
    get subtype() {
        return this.item.system.type ?? CompanionType.CONNECTION;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.off('click', `.${this.cls}-open`);
        html.on('click', `.${this.cls}-open`, (ev) => {
            const el = ev.currentTarget.querySelector('#companion'); //.dataset; // .innerText;
            if (!el) return;
            /** @type {string} */
            const uuid = el.dataset.itemActorUuid;
            /** @type {import('../../actor/actor').ActorHM3 | null} */
            const actor = fromUuidSync(uuid);
            actor?.sheet?.render(true);
        });
    }
}
