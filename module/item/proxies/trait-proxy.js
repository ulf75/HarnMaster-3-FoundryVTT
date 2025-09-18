// @ts-check
import {ItemProxy} from './item-proxy';

export class TraitProxy extends ItemProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-trait';
    }
    /**
     * @type {string}
     */
    get label() {
        if (this.subtype === 'Psyche') {
            // @ts-expect-error
            return `${game.hm3.config.psycheSeverity.find((v) => v.key === this.severity).label} ${this.name}`;
        } else return this.name;
    }
    /**
     * @type {string | null}
     */
    get severity() {
        return this.subtype === 'Psyche' ? this.item.system.severity ?? '5' : null;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);
    }
}
