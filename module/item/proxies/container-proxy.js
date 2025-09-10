import {GearProxy} from './gear-proxy';

export class ContainerProxy extends GearProxy {
    get collapsed() {
        return this._item.system.collapsed;
    }
}
