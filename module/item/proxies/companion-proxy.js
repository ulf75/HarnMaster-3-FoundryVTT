// @ts-check
import {ItemProxy} from './item-proxy';

export class CompanionProxy extends ItemProxy {
    /**
     * @type {string}
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
     * @type {Actor}
     */
    get companion() {
        return fromUuidSync(this.item.system.actorUuid);
    }
    /**
     * @type {string}
     */
    get gender() {
        return this.companion?.system.gender ?? 'Male';
    }
    /**
     * @type {string}
     */
    get img() {
        return this.companion?.img;
    }
    /**
     * @type {string}
     */
    get linkToActor() {
        return this.companion?.link;
    }
    /**
     * @type {string}
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

    activateListeners(html) {
        super.activateListeners(html);

        html.off('click', `.${this.cls}-open`);
        html.on('click', `.${this.cls}-open`, (ev) => {
            const el = ev.currentTarget.querySelector('#companion'); //.dataset; // .innerText;
            if (!el) return;
            const uuid = el.dataset.itemActorUuid;
            const actor = fromUuidSync(uuid);
            actor.sheet.render(true);
        });
    }
}
