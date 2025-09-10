import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';

export class ActorProxy {
    constructor(actor) {
        this._actor = actor;
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

    get END() {
        const ML = this.proxies.find((item) => item.name === 'Condition')?.ML;
        return Math.round(
            ML
                ? ML / 5
                : (this.system.abilities.strength.base +
                      this.system.abilities.stamina.base +
                      this.system.abilities.will.base) /
                      3
        );
    }

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

    get dodge() {
        return this.proxies.find((item) => item.name === 'Dodge')?.EML;
    }

    get initiative() {
        return this.proxies.find((item) => item.name === 'Initiative')?.EML;
    }

    // Encumbrance Penalty
    get EP() {
        return Math.floor(this.totalGearWeight / this.END);
    }

    // Fatigue Penalty
    get FP() {
        return this._actor.system.fatigue || 0;
    }

    // Injury Penalty
    get IP() {
        return this.proxies
            .filter((item) => item.type === ItemType.INJURY)
            .reduce((partialSum, item) => partialSum + item.IL, 0);
    }

    get UP() {
        return this.IP + this.FP;
    }

    get PP() {
        return this.UP + this.EP;
    }

    get containers() {
        const containers = [{label: 'On Person', key: 'on-person'}];

        // Containers are not allowed in other containers.  So if this item is a container,
        // don't show any other containers.
        if (this.actor && this.type !== ItemType.CONTAINERGEAR) {
            this.actor.items.forEach((item) => {
                if (item.type === ItemType.CONTAINERGEAR) {
                    containers.push({label: item.name, key: item.id});
                }
            });
        }
        return containers;
    }
}
