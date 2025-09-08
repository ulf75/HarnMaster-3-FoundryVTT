import {ItemType} from '../../hm3-types';
import {ItemProxy} from './item-proxy';

export class ArmorlocationProxy extends ItemProxy {
    static TotalWeightHigh = 0;
    static TotalWeightMid = 0;
    static TotalWeightLow = 0;

    constructor(item) {
        super(item);
        this._calcProbWeights();
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
