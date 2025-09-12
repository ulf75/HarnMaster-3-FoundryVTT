import {GearProxy} from './gear-proxy';

export class ContainerProxy extends GearProxy {
    get capacity() {
        return this._item.system.capacity;
    }
    get collapsed() {
        return this._item.system.collapsed;
    }
}
