// @ts-check
import {InjuryType} from '../../hm3-types';
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
     * @type {string}
     */
    get aspect() {
        return this.item.system.aspect;
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
    /**
     * @type {string}
     */
    get severity() {
        this.item.system.severity = this.IL >= 4 ? 'G' : this.IL >= 2 ? 'S' : 'M';
        return `${this.item.system.severity}${this.IL}`;
    }
    /**
     * @type {InjuryType}
     * @override
     */
    get subtype() {
        return this.item.system.type ?? InjuryType.HEALING;
    }

    /**
     * @param {JQuery} html
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);
    }
}
