import {ItemProxy} from './item-proxy';

export class SpellProxy extends ItemProxy {
    get convocation() {
        return this._item.system.convocation;
    }

    get level() {
        return this._item.system.level;
    }
}
