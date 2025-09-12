import {GearProxy} from './gear-proxy';

export class EffectProxy extends GearProxy {
    get visible() {
        return game.user.isGM;
    }
}
