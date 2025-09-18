// @ts-check
import {ItemProxy} from './item-proxy';

export class InjuryProxy extends ItemProxy {
    /**
     * @type {string}
     * @override
     */
    get cls() {
        return super.cls + '-injury';
    }
    /**
     * @type {number}
     */
    get HR() {
        return this.item.system.healRate;
    }
    /**
     * @type {number}
     */
    get IL() {
        return this.item.system.injuryLevel;
    }
    /**
     * @type {string}
     */
    get label() {
        return this.HR !== undefined ? (this.HR === 0 ? `Treatment Roll` : `Healing Roll`) : '';
    }
    get severity() {
        return this.item.system.severity;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);
    }
}
