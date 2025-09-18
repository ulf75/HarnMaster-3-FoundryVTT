// @ts-check
import {GearProxy} from './gear-proxy';

export class ArmorProxy extends GearProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-armor';
    }
    /**
     * @type {number}
     */
    get AQ() {
        return this.item.system.armorQuality;
    }
    /**
     * @type {number}
     */
    get blunt() {
        return this.item.system.protection.blunt;
    }
    /**
     * @type {number}
     */
    get edged() {
        return this.item.system.protection.edged;
    }
    /**
     * @type {number}
     */
    get piercing() {
        return this.item.system.protection.piercing;
    }
    /**
     * @type {number}
     */
    get fire() {
        return this.item.system.protection.fire;
    }
    /**
     * @type {string[]}
     */
    get locations() {
        return this.item.system.locations;
    }
    /**
     * @type {string}
     */
    get material() {
        return this.item.system.material;
    }
    /**
     * @type {number}
     */
    get size() {
        return this.item.system.size;
    }
    /**
     * @type {string}
     */
    get targetLocation() {
        return this.item.system.targetLocation;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);
    }
}
