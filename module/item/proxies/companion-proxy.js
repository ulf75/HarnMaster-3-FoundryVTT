import {ItemProxy} from './item-proxy';

export class CompanionProxy extends ItemProxy {
    constructor(item) {
        super(item);
        this._companion = fromUuidSync(this._item.system.actorUuid);
    }

    get cls() {
        return super.cls + '-companion';
    }
    get actorUuid() {
        return this._item.system.actorUuid;
    }
    get companion() {
        return this._companion;
    }
    get gender() {
        return this.companion?.system.gender ?? 'Male';
    }
    get img() {
        return this.companion?.img;
    }
    get linkToActor() {
        return this.companion?.link;
    }
    get name() {
        return this.companion?.name ?? 'Unknown';
    }
    get occupation() {
        return this.companion?.system.occupation ?? 'Unknown';
    }
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
