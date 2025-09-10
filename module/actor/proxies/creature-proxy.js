import {ActorProxy} from './actor-proxy';

export class CreatureProxy extends ActorProxy {
    get species() {
        return this._actor.system.species;
    }
}
