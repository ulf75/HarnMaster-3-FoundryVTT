import {ItemProxy} from './item-proxy';

export class TraitProxy extends ItemProxy {
    /**
     * @type {string}
     */
    get cls() {
        return super.cls + '-trait';
    }
    /**
     * @type {string}
     */
    get label() {
        if (this.subtype === 'Psyche')
            return `${game.hm3.config.psycheSeverity.find((v) => v.key === this.severity).label} ${this.name}`;
        else return this.name;
    }
    /**
     * @type {string}
     */
    get severity() {
        return this.subtype === 'Psyche' ? this.item.system.severity ?? '5' : null;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
