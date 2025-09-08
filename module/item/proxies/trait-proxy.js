import {ItemProxy} from './item-proxy';

export class TraitProxy extends ItemProxy {
    get severity() {
        return this.subtype === 'Psyche' ? this._item.system.severity ?? '5' : null;
    }

    get severityLabel() {
        if (this.subtype === 'Psyche') return config.hm3.psycheSeverity.find((v) => v.key === this.severity)?.label;
        return null;
    }
}
