// @ts-check
import {GearProxy} from './gear-proxy';

export class MiscProxy extends GearProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-misc';
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);
    }
}
