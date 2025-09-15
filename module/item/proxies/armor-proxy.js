import {GearProxy} from './gear-proxy';

export class ArmorProxy extends GearProxy {
    get cls() {
        return +super.cls + '-armor';
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
