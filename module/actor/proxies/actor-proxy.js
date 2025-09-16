import {DiceHM3} from '../../hm3-dice';
import {ItemType} from '../../hm3-types';
import {callOnHooks} from '../../macros';
import {HM100Check, truncate} from '../../utility';
import {ActorHM3} from '../actor';

export class ActorProxy {
    #actor = null;

    constructor(actor) {
        this.#actor = actor;
    }

    /**
     * @type {ActorHM3}
     */
    get actor() {
        return this.#actor;
    }
    /**
     * @type {string}
     */
    get id() {
        return this.actor.id;
    }
    /**
     * @type {string}
     */
    get img() {
        return this.actor.img;
    }
    /**
     * @type {string}
     */
    get link() {
        return this.actor.link;
    }
    get macrolist() {
        return this.actor.macrolist
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
    /**
     * @type {string}
     */
    get name() {
        return this.actor.name;
    }
    get proxies() {
        return this.actor.proxies;
    }
    /**
     * @type {string}
     */
    get type() {
        return this.actor.type;
    }
    /**
     * @type {string}
     */
    get subtype() {
        return this.actor.subtype;
    }
    /**
     * @type {string}
     */
    get uuid() {
        return this.actor.uuid;
    }

    //
    // System Stats
    //

    /**
     * @type {string}
     */
    get bioImage() {
        return this.actor.system.bioImage;
    }
    /**
     * @type {string}
     */
    get description() {
        return this.actor.system.description;
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

        html.off('click', '.ability-d6-roll');
        html.on('click', '.ability-d6-roll', async (ev) => {
            const ability = ev.currentTarget.dataset.ability;
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const target = this[ability].effective;

            const stdRollData = {
                fastforward,
                label: `3d6 ${ability[0].toUpperCase()}${ability.slice(1)} Roll`,
                numdice: 3,
                skill: `${ability[0].toUpperCase()}${ability.slice(1)}`,
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                target,
                type: `${ability}-d6`
            };

            if (this.actor.isToken) stdRollData.token = this.actor.token.id;
            else stdRollData.actor = this.actor.id;

            const hooksOk = Hooks.call('hm3.preAbilityRollD6', stdRollData, this.actor);
            if (hooksOk) {
                const result = await DiceHM3.d6Roll(stdRollData);
                if (result) callOnHooks('hm3.onAbilityRollD6', result, result, stdRollData);
                return result;
            }
            return null;
        });

        html.off('click', '.ability-d100-roll');
        html.on('click', '.ability-d100-roll', async (ev) => {
            const ability = ev.currentTarget.dataset.ability;
            const fastforward = ev.shiftKey || ev.altKey || ev.ctrlKey;
            const effSkillBase = this[ability].effective;

            const stdRollData = {
                effSkillBase,
                fastforward,
                isAbility: true,
                label: `1d100 ${ability[0].toUpperCase()}${ability.slice(1)} Roll`,
                multiplier: 5,
                skill: `${ability[0].toUpperCase()}${ability.slice(1)}`,
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                target: HM100Check(effSkillBase * 5),
                type: `${ability}-d100`
            };

            if (this.actor.isToken) stdRollData.token = this.actor.token.id;
            else stdRollData.actor = this.actor.id;

            const hooksOk = Hooks.call('hm3.preAbilityRollD100', stdRollData, this.actor);
            if (hooksOk) {
                const result = await DiceHM3.d100StdRoll(stdRollData);
                if (result) callOnHooks('hm3.onAbilityRollD100', this.actor, result, stdRollData);
                return result;
            }
            return null;
        });
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
