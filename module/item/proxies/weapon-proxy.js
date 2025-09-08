import {GearProxy} from './gear-proxy';

export class WeaponProxy extends GearProxy {
    get WQ() {
        return this._item.system.weaponQuality;
    }

    get wqModifier() {
        return this._item.system.wqModifier || 0;
    }

    get wqTotal() {
        return this.WQ + this.wqModifier;
    }
}
