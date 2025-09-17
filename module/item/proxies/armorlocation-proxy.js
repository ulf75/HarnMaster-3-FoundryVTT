// @ts-check
import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ItemProxy} from './item-proxy';

export class ArmorlocationProxy extends ItemProxy {
    /** @type {number} */
    static TotalWeightHigh = 0;
    /** @type {number} */
    static TotalWeightMid = 0;
    /** @type {number} */
    static TotalWeightLow = 0;

    /**
     * @type {string}
     */
    get cls() {
        return super.cls + '-armor-location';
    }
    /**
     * @type {string}
     */
    get layers() {
        return this.item.system.layers;
    }
    /**
     * @type {number}
     */
    get blunt() {
        return this.item.system.blunt;
    }
    /**
     * @type {number}
     */
    get edged() {
        return this.item.system.edged;
    }
    /**
     * @type {number}
     */
    get piercing() {
        return this.item.system.piercing;
    }
    /**
     * @type {number}
     */
    get fire() {
        return this.item.system.fire;
    }

    /**
     * @type {number}
     */
    get probWeightHigh() {
        return this.item.system.probWeight.high;
    }
    /**
     * @type {number}
     */
    get probWeightMid() {
        return this.item.system.probWeight.mid;
    }
    /**
     * @type {number}
     */
    get probWeightLow() {
        return this.item.system.probWeight.low;
    }
    /**
     * @type {number}
     */
    get probHigh() {
        return truncate(this.probWeightHigh / this.totalWeightHigh, 1);
    }
    /**
     * @type {number}
     */
    get probMid() {
        return truncate(this.probWeightMid / this.totalWeightMid, 1);
    }
    /**
     * @type {number}
     */
    get probLow() {
        return truncate(this.probWeightLow / this.totalWeightLow, 1);
    }
    /**
     * @type {number}
     */
    get totalWeightHigh() {
        this._calcProbWeights();
        return ArmorlocationProxy.TotalWeightHigh;
    }
    /**
     * @type {number}
     */
    get totalWeightMid() {
        this._calcProbWeights();
        return ArmorlocationProxy.TotalWeightMid;
    }
    /**
     * @type {number}
     */
    get totalWeightLow() {
        this._calcProbWeights();
        return ArmorlocationProxy.TotalWeightLow;
    }

    _calcProbWeights() {
        if (ArmorlocationProxy.TotalWeightHigh !== 0) return;

        this.actor.proxies.forEach((item) => {
            if (item.type === ItemType.ARMORLOCATION) {
                ArmorlocationProxy.TotalWeightHigh += item.probWeightHigh;
                ArmorlocationProxy.TotalWeightMid += item.probWeightMid;
                ArmorlocationProxy.TotalWeightLow += item.probWeightLow;
            }
        });
        ArmorlocationProxy.TotalWeightHigh /= 100;
        ArmorlocationProxy.TotalWeightMid /= 100;
        ArmorlocationProxy.TotalWeightLow /= 100;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
