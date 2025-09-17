// @ts-check
import {LivingProxy} from './living-proxy';

export class CreatureProxy extends LivingProxy {
    /**
     * @type {string}
     */
    get damageDie() {
        return this.size;
    }
}
