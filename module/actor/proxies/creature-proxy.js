import {LivingProxy} from './living-proxy';

export class CreatureProxy extends LivingProxy {
    get damageDie() {
        return this.size;
    }
}
