import {ActorProxy} from './actor-proxy';

export class CharacterProxy extends ActorProxy {
    get occupation() {
        return this._actor.system.occupation;
    }
}
