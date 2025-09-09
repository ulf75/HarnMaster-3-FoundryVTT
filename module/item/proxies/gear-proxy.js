import {truncate} from '../../utility';
import {ItemProxy} from './item-proxy';

export class GearProxy extends ItemProxy {
    get value() {
        return this._item.system.value;
    }

    get weight() {
        return this._item.system.weight;
    }

    get weightT() {
        return truncate(this.weight, 3);
    }

    get quantity() {
        return this._item.system.quantity;
    }

    get isEquipped() {
        return this._item.system.isEquipped;
    }

    get isCarried() {
        return this._item.system.isCarried;
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
