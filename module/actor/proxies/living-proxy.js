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
    get shockIndex() {
        return {value: this._actor.system.shockIndex.value, max: 100};
    }
    get dodge() {
        return this.proxies.find((item) => item.name === 'Dodge')?.EML || 0;
    }
    get initiative() {
        return this.proxies.find((item) => item.name === 'Initiative')?.EML;
    }
}
