import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ItemProxy} from './item-proxy';

export class ArmorlocationProxy extends ItemProxy {
    static TotalWeightHigh = 0;
    static TotalWeightMid = 0;
    static TotalWeightLow = 0;

    constructor(item) {
        super(item);
        this._calcProbWeights();
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
        return ArmorlocationProxy.TotalWeightHigh;
    }

    get totalWeightMid() {
        return ArmorlocationProxy.TotalWeightMid;
    }

    get totalWeightLow() {
        return ArmorlocationProxy.TotalWeightLow;
    }

    _calcProbWeights() {
        if (ArmorlocationProxy.TotalWeightHigh !== 0) return;

        this.actor.items.forEach((item) => {
            if (item.type === ItemType.ARMORLOCATION) {
                ArmorlocationProxy.TotalWeightHigh += item.system.probWeight['high'];
                ArmorlocationProxy.TotalWeightMid += item.system.probWeight['mid'];
                ArmorlocationProxy.TotalWeightLow += item.system.probWeight['low'];
            }
        });
        ArmorlocationProxy.TotalWeightHigh /= 100;
        ArmorlocationProxy.TotalWeightMid /= 100;
        ArmorlocationProxy.TotalWeightLow /= 100;
    }
}
