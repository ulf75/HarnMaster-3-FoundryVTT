// @ts-check
import {GearProxy} from './gear-proxy';

export class ContainerProxy extends GearProxy {
    /**
     * @type {string}
     */
    get cls() {
        return super.cls + '-container';
    }
    /**
     * @type {{max: number, value: number}}
     */
    get capacity() {
        return this.item.system.capacity ?? {max: 1, value: 0};
    }
    /**
     * @type {boolean}
     */
    get collapsed() {
        return (this.item.system.collapsed ?? false) || this.locked;
    }
    /**
     * @type {boolean}
     */
    get locked() {
        return this.item.system.locked ?? false;
    }

    activateListeners(html) {}
}
