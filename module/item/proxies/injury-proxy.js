import {ItemProxy} from './item-proxy';

export class InjuryProxy extends ItemProxy {
    get HR() {
        return this._item.system.healRate;
    }

    get IL() {
        return this._item.system.injuryLevel;
    }

    get label() {
        return this.HR !== undefined ? (this.HR === 0 ? `Treatment Roll` : `Healing Roll`) : undefined;
    }

    get severity() {
        return this._item.system.severity;
    }
}
