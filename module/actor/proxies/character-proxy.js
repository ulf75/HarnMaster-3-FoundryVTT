import {LivingProxy} from './living-proxy';

export class CharacterProxy extends LivingProxy {
    /**
     * @type {string}
     */
    get culture() {
        return this._actor.system.culture;
    }
    /**
     * @type {string}
     */
    get frame() {
        return this._actor.system.frame;
    }
    get heigth() {
        return this._actor.system.heigth;
    }
    /**
     * @type {string}
     */
    get occupation() {
        return this._actor.system.occupation;
    }
    /**
     * @type {string}
     */
    get socialClass() {
        return this._actor.system.socialClass;
    }
    /**
     * @type {string}
     */
    get species() {
        return super.species || 'Human';
    }
    /**
     * @type {string}
     */
    get sunsign() {
        return this._actor.system.sunsign;
    }
    get weight() {
        return this._actor.system.weight;
    }
}
