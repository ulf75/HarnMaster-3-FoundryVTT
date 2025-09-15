import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ItemProxy} from './item-proxy';

export class ArmorlocationProxy extends ItemProxy {
    static TotalWeightHigh = 0;
    static TotalWeightMid = 0;
    static TotalWeightLow = 0;

    get cls() {
        return super.cls + '-armor-location';
    }
    get layers() {
        return this._item.system.layers;
    }
    get blunt() {
        return this._item.system.blunt;
    }
    get edged() {
        return this._item.system.edged;
    }
    get piercing() {
        return this._item.system.piercing;
    }
    get fire() {
        return this._item.system.fire;
    }

    get probWeightHigh() {
        return this._item.system.probWeight.high;
    }

    get probWeightMid() {
        return this._item.system.probWeight.mid;
    }

    get probWeightLow() {
        return this._item.system.probWeight.low;
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
