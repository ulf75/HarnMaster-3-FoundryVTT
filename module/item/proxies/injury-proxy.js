import {ItemProxy} from './item-proxy';

export class InjuryProxy extends ItemProxy {
    get IL() {
        return this._item.system.injuryLevel;
    }
}
