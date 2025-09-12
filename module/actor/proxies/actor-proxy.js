import {ItemType} from '../../hm3-types';

export class ActorProxy {
    constructor(actor) {
        this._actor = actor;
    }

    get actor() {
        return this._actor;
    }
    get id() {
        return this._actor.id;
    }
    get img() {
        return this._actor.img;
    }
    get link() {
        return this._actor.link;
    }
    get macrolist() {
        return this._actor.macrolist
            .map((m) => {
                m.trigger = game.macros.get(m.id)?.getFlag('hm3', 'trigger');
                m.ownerId = game.macros.get(m.id)?.getFlag('hm3', 'ownerId'); // currently not needed
                return m;
            })
            .sort((a, b) =>
                a?.name.toLowerCase() > b?.name.toLowerCase()
                    ? 1
                    : b?.name.toLowerCase() > a?.name.toLowerCase()
                    ? -1
                    : 0
            );
    }
    get name() {
        return this._actor.name;
    }
    get proxies() {
        return this._actor.proxies;
    }
    get type() {
        return this._actor.type;
    }
    get subtype() {
        return this._actor.subtype;
    }
    get uuid() {
        return this._actor.uuid;
    }

    //
    // System Stats
    //

    get bioImage() {
        return this._actor.system.bioImage;
    }
    get description() {
        return this._actor.system.description;
    }
    get hasDescription() {
        return this.description && this.description.length > 0;
    }

    //
    // Derived Stats
    //

    // get containers() {
    //     const containers = [{label: 'On Person', key: 'on-person'}];

    //     // Containers are not allowed in other containers.  So if this item is a container,
    //     // don't show any other containers.
    //     if (this.actor && this.type !== ItemType.CONTAINERGEAR) {
    //         this.actor.items.forEach((item) => {
    //             if (item.type === ItemType.CONTAINERGEAR) {
    //                 containers.push({label: item.name, key: item.id});
    //             }
    //         });
    //     }
    //     return containers;
    // }

    HM100Check(value) {
        return Math.max(Math.min(Math.round(value), 95), 5);
    }

    HM6Check(value) {
        return Math.max(Math.round(value), 1);
    }

    Skill(name) {
        return this.proxies.find(
            (item) => item.type === ItemType.SKILL && item.name.toLowerCase().includes(name.toLowerCase())
        );
    }
}
