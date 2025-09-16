import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ItemProxy} from './item-proxy';

export class ArmorlocationProxy extends ItemProxy {
    static TotalWeightHigh = 0;
    static TotalWeightMid = 0;
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
    get blunt() {
        return this.item.system.blunt;
    }
    get edged() {
        return this.item.system.edged;
    }
    get piercing() {
        return this.item.system.piercing;
    }
    get fire() {
        return this.item.system.fire;
    }

    get probWeightHigh() {
        return this.item.system.probWeight.high;
    }

    get probWeightMid() {
        return this.item.system.probWeight.mid;
    }

    get probWeightLow() {
        return this.item.system.probWeight.low;
    }

    get probHigh() {
        return truncate(this.probWeightHigh / this.totalWeightHigh, 1);
    }

    get probMid() {
        return truncate(this.probWeightMid / this.totalWeightMid, 1);
    }

    get probLow() {
        return truncate(this.probWeightLow / this.totalWeightLow, 1);
    }

    get totalWeightHigh() {
        this._calcProbWeights();
        return ArmorlocationProxy.TotalWeightHigh;
    }

    get totalWeightMid() {
        this._calcProbWeights();
        return ArmorlocationProxy.TotalWeightMid;
    }

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
