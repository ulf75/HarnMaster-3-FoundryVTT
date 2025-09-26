// @ts-check
import {ContainerItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {GearProxy} from './gear-proxy';
import {ItemProxy} from './item-proxy';

export class ContainerProxy extends GearProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-container';
    }
    /**
     * @type {{max: number, value: number}}
     */
    get capacity() {
        return {
            max: truncate(this.item.system.capacity.max),
            value: truncate(this.content.reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0))
        };
    }
    /**
     * @type {boolean}
     */
    get collapsed() {
        return (this.item.system.collapsed ?? false) || this.locked;
    }
    /**
     * @type {ItemProxy[]}
     */
    get content() {
        return this.aproxy?.proxies.filter((item) => item.container === this.id) ?? [];
    }
    /**
     * @type {boolean}
     */
    get locked() {
        return this.item.system.locked ?? false;
    }
    /** @override */
    get subtype() {
        return this.item.system.type ?? ContainerItemType.CONTAINER;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);
    }
}
