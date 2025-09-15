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

    Skill(name) {
        return this.proxies.find(
            (item) => item.type === ItemType.SKILL && item.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    activateListeners(html) {
        let visited = {};
        this.proxies.forEach((element) => {
            if (!visited[element.cls]) {
                element.activateListeners(html);
                visited[element.cls] = true;
            }
        });
        visited = {};
    }

    /**
     * This method searches through all the active effects on this actor and applies
     * only that active effect whose key matches the specified 'property' value.
     *
     * The purpose is to allow an active effect to be applied after normal active effect
     * processing is complete.
     *
     * @param {String} property The Actor data model property to apply
     * @param {number} value
     */
    applySpecificActiveEffect(property, value) {
        const overrides = {};
        foundry.utils.setProperty(this.actor, property, value);

        // Organize non-disabled effects by their application priority
        const changes = this.actor.allApplicableEffects(true).reduce((chgs, e) => {
            if (!e.active) return chgs;
            const chgList = e.changes.filter((chg) => chg.key === property);
            return chgs.concat(
                chgList.map((c) => {
                    c = foundry.utils.duplicate(c);
                    c.effect = e;
                    c.priority = c.priority ?? c.mode * 10;
                    return c;
                })
            );
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            change.effect.apply(this.actor, change);
            const result = this.roundChange(this.actor, change);
            if (result !== null) overrides[change.key] = result;
        }

        // Expand the set of final overrides
        // foundry.utils.mergeObject(this.overrides, foundry.utils.expandObject(overrides));
        return Math.max(Math.round(overrides[property] ?? value), 0);
    }

    roundChange(item, change) {
        const current = foundry.utils.getProperty(item, change.key) ?? null;
        const ct = foundry.utils.getType(current);
        if (ct === 'number' && !Number.isInteger(current)) {
            const update = Math.round(current + Number.EPSILON);
            foundry.utils.setProperty(item, change.key, update);
            return update;
        } else {
            return current;
        }
    }
}
