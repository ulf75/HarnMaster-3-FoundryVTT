import {LivingProxy} from './living-proxy';

export class CharacterProxy extends LivingProxy {
    get culture() {
        return this._actor.system.culture;
    }
    get frame() {
        return this._actor.system.frame;
    }
    get heigth() {
        return this._actor.system.heigth;
    }
    get occupation() {
        return this._actor.system.occupation;
    }
    get socialClass() {
        return this._actor.system.socialClass;
    }
    get species() {
        return super.species || 'Human';
    }
    get sunsign() {
        return this._actor.system.sunsign;
    }
    get weight() {
        return this._actor.system.weight;
    }
}
