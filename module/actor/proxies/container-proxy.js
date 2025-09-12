import {ActorProxy} from './actor-proxy';

export class ContainerProxy extends ActorProxy {
    get capacityMax() {
        return this._actor.system.capacity.max;
    }
    get capacityVal() {
        return this._actor.system.capacity.value;
    }
}
