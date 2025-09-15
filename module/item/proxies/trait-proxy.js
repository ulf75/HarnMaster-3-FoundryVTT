import {ItemProxy} from './item-proxy';

export class TraitProxy extends ItemProxy {
    get cls() {
        return super.cls + '-trait';
    }
    get label() {
        if (this.subtype === 'Psyche')
            return `${game.hm3.config.psycheSeverity.find((v) => v.key === this.severity).label} ${this.name}`;
        else return this.name;
    }
    get severity() {
        return this.subtype === 'Psyche' ? this._item.system.severity ?? '5' : null;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
