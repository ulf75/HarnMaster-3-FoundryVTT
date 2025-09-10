import {ItemProxy} from './item-proxy';

export class InvocationProxy extends ItemProxy {
    get circle() {
        return this._item.system.circle;
    }

    get diety() {
        return this._item.system.diety;
    }

    get EML() {
        return this.actor.proxies.find((item) => item.name === this.diety).EML - 5 * this.circle;
    }
}
