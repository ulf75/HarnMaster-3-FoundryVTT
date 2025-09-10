import {ActorProxy} from './actor-proxy';

export class LivingProxy extends ActorProxy {
    get biography() {
        return this._actor.system.biography;
    }
    get gender() {
        return this._actor.system.gender;
    }
    get size() {
        return this._actor.system.size;
    }
    get species() {
        return this._actor.system.species;
    }
}
