// @ts-check
import {MiscItemType} from '../../hm3-types';
import {GearProxy} from './gear-proxy';

export class MiscProxy extends GearProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-misc';
    }
    /** @override */
    get subtype() {
        return this.item.system.type ?? MiscItemType.MISC;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);
    }
}
