// @ts-check
import {LivingProxy} from './living-proxy';

/**
 * @class
 * @extends LivingProxy
 */
export class CreatureProxy extends LivingProxy {
    /**
     * @type {number}
     * @override
     */
    get damageDie() {
        return this.size;
    }
}
