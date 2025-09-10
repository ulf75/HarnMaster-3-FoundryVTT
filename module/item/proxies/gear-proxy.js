import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ItemProxy} from './item-proxy';

export class GearProxy extends ItemProxy {
    get hasValue() {
        return true;
    }
    get isArtifact() {
        return this._item.isArtifact;
    }
    get isCarried() {
        return this._item.system.isCarried;
    }
    get isEquipped() {
        return this._item.system.isEquipped;
    }
    get isMajorArtifact() {
        return this._item.isMajorArtifact;
    }
    get isMinorArtifact() {
        return this._item.isMinorArtifact;
    }
    get quantity() {
        return this._item.system.quantity;
    }
    get value() {
        return this._item.system.value;
    }
    get weight() {
        return this._item.system.weight;
    }
    get weightT() {
        return truncate(this.weight, 3);
    }

    get equipLabel() {
        if (this.type === ItemType.ARMORGEAR) return this.isEquipped ? `Doff ${this.name}` : `Don ${this.name}`;
        return this.isEquipped ? `Unequip ${this.name}` : `Equip ${this.name}`;
    }

    get carryLabel() {
        return this.isCarried ? `Drop ${this.name}` : `Carry ${this.name}`;
    }
}
