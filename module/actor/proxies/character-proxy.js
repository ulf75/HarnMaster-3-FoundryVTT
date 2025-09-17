// @ts-check
import {LivingProxy} from './living-proxy';

/**
 * @class
 * @extends LivingProxy
 */
export class CharacterProxy extends LivingProxy {
    /**
     * @type {string}
     */
    get culture() {
        return this.actor.system.culture;
    }
    /**
     * @type {string}
     */
    get frame() {
        return this.actor.system.frame;
    }
    /**
     * @type {number}
     */
    get heigth() {
        return this.actor.system.heigth;
    }
    /**
     * @type {string}
     */
    get occupation() {
        return this.actor.system.occupation;
    }
    /**
     * @type {string}
     */
    get socialClass() {
        return this.actor.system.socialClass;
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
        return this.actor.system.sunsign;
    }
    /**
     * @type {number}
     */
    get weight() {
        return this.actor.system.weight;
    }
}
