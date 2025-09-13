import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';

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

    get totalArmorWeight() {
        return truncate(
            this.proxies
                .filter((item) => item.type === ItemType.ARMORGEAR && item.isCarried)
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }

    get totalMiscGearWeight() {
        return truncate(
            this.proxies
                .filter(
                    (item) =>
                        (item.type === ItemType.MISCGEAR || item.type === ItemType.CONTAINERGEAR) && item.isCarried
                )
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }

    get totalMissileWeight() {
        return truncate(
            this.proxies
                .filter((item) => item.type === ItemType.MISSILEGEAR && item.isCarried)
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }

    get totalWeaponWeight() {
        return truncate(
            this.proxies
                .filter((item) => item.type === ItemType.WEAPONGEAR && item.isCarried)
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }

    get totalGearWeight() {
        return truncate(
            this.totalArmorWeight + this.totalMiscGearWeight + this.totalMissileWeight + this.totalWeaponWeight
        );
    }
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
