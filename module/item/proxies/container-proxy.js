import {GearProxy} from './gear-proxy';

export class ContainerProxy extends GearProxy {
    get capacityMax() {
        return this._item.system.capacity.max;
    }
    get capacityVal() {
        return this._item.system.capacity.value;
    }
    get collapsed() {
        return this._item.system.collapsed;
    }
}
