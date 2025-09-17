// @ts-check
import {GearProxy} from './gear-proxy';

export class ArmorProxy extends GearProxy {
    /**
     * @type {string}
     */
    get cls() {
        return +super.cls + '-armor';
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
