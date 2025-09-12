import {ActorProxy} from './actor-proxy';

export class ContainerProxy extends ActorProxy {
    get capacity() {
        return this._actor.system.capacity;
    }
}
