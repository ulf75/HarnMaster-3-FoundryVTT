import {GearProxy} from './gear-proxy';

export class MiscProxy extends GearProxy {
    get cls() {
        return super.cls + '-misc';
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
