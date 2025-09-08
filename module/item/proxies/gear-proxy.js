import {ItemProxy} from './item-proxy';

export class GearProxy extends ItemProxy {
    get value() {
        return this._item.system.value;
    }

    get weight() {
        return this._item.system.weight;
    }

    get quantity() {
        return this._item.system.quantity;
    }

    get isArtifact() {
        return this._item.isArtifact;
    }

    get isMinorArtifact() {
        return this._item.isMinorArtifact;
    }

    get isMajorArtifact() {
        return this._item.isMajorArtifact;
    }
}
