// @ts-check
import {DiceHM3} from '../../hm3-dice';
import {ItemType} from '../../hm3-types';
import {callOnHooks} from '../../macros';
import {HM100Check, parseAEValue, truncate} from '../../utility';
import {ActorHM3} from '../actor';

/**
 * @class
 * @abstract
 */
export class ActorProxy {
    /** @type ActorHM3 */
    #actor;

    constructor(actor) {
        this.#actor = actor;
    }

    /**
     * @type {Actor}
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
    get itemTypes() {
        // @ts-expect-error
        const types = Object.fromEntries(game.documentTypes.Item.map((t) => [t, []]));
        for (const item of this.proxies) {
            types[item.type].push(item);
        }
        return types;
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
                // @ts-expect-error
                m.trigger = game.macros.get(m.id)?.getFlag('hm3', 'trigger');
                // @ts-expect-error
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
    /**
     * @type {boolean}
     */
    get hasDescription() {
        return !!this.description && this.description.length > 0;
    }

    //
    // Derived Stats
    //

    /**
     * @type {number}
     */
    get totalArmorWeight() {
        return truncate(
            this.proxies
                .filter((item) => item.type === ItemType.ARMORGEAR && item.isCarried)
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }
    /**
     * @type {number}
     */
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
    /**
     * @type {number}
     */
    get totalMissileWeight() {
        return truncate(
            this.proxies
                .filter((item) => item.type === ItemType.MISSILEGEAR && item.isCarried)
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }
    /**
     * @type {number}
     */
    get totalWeaponWeight() {
        return truncate(
            this.proxies
                .filter((item) => item.type === ItemType.WEAPONGEAR && item.isCarried)
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }
    /**
     * @type {number}
     */
    get totalGearWeight() {
        return truncate(
            this.totalArmorWeight + this.totalMiscGearWeight + this.totalMissileWeight + this.totalWeaponWeight
        );
    }
    /**
     *  Universal Penalty
     * @type {number}
     * @abstract
     */
    get UP() {
        return 0;
    }
    /**
     * Physical Penalty
     * @type {number}
     * @abstract
     */
    get PP() {
        return 0;
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
    _applySpecificActiveEffect(property, value) {
        const overrides = {};
        // @ts-expect-error
        foundry.utils.setProperty(this.actor, property, value);

        // Organize non-disabled effects by their application priority
        const changes = this.actor.allApplicableEffects(true).reduce((chgs, effect) => {
            if (!effect.active) return chgs;
            const chgList = effect.changes.filter((chg) => chg.key === property);
            return chgs.concat(
                chgList.map((chg) => {
                    // @ts-expect-error
                    chg = foundry.utils.duplicate(chg);
                    chg.effect = effect;
                    chg.priority = chg.priority ?? chg.mode * 10;
                    return chg;
                })
            );
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            change.effect.apply(this.actor, change);
            const result = this._roundChange(this.actor, change);
            if (result !== null) overrides[change.key] = result;
        }

        // Expand the set of final overrides
        // foundry.utils.mergeObject(this.overrides, foundry.utils.expandObject(overrides));
        return Math.max(Math.round(overrides[property] ?? value), 0);
    }

    /**
     * This method implements Item-based weapon effects.  It applies two types of AE:
     *   Weapon Attack ML - Modifies the AML of a single weapon
     *   Weapon Defense ML - Modifies the DML of a single weapon
     *
     * Note that unlike normal Active Effects, these effects apply to the Items data model,
     * not the Actor's data model.
     *
     * The "value" field should look like "<item name>:<magnitude>"
     */
    applyWeaponActiveEffects() {
        const overrides = {};
        // foundry.utils.setProperty(this.actor, 'system.v2.itemAMLMod', value);

        const changes = this.actor.allApplicableEffects(true).reduce((chgs, effect) => {
            if (!effect.active) return chgs;
            const amlChanges = effect.changes.filter((chg) => {
                if (chg.key === 'system.v2.itemAMLMod') {
                    const val = parseAEValue(chg.value);
                    if (val.length != 2) return false;
                    const magnitude = Number.parseInt(val[1], 10);
                    if (isNaN(magnitude)) return false;
                    const skillName = val[0];
                    for (let item of this.proxies) {
                        if (
                            item.name === skillName &&
                            (item.type === ItemType.WEAPONGEAR || item.type === ItemType.MISSILEGEAR)
                        )
                            return true;
                    }
                }

                return false;
            });

            const dmlChanges = effect.changes.filter((chg) => {
                if (chg.key === 'system.v2.itemDMLMod') {
                    const val = parseAEValue(chg.value);
                    if (val.length != 2) return false;
                    const magnitude = Number.parseInt(val[1], 10);
                    if (isNaN(magnitude)) return false;
                    const skillName = val[0];
                    for (let item of this.proxies) {
                        if (item.name === skillName && item.type === ItemType.WEAPONGEAR) return true;
                    }
                }

                return false;
            });

            const allChanges = amlChanges.concat(dmlChanges);
            return chgs.concat(
                allChanges.map((chg) => {
                    // @ts-expect-error
                    chg = foundry.utils.duplicate(chg);
                    const val = parseAEValue(chg.value);
                    const itemName = val[0];
                    chg.value = Number.parseInt(val[1], 10);
                    switch (chg.key) {
                        case 'system.v2.itemAMLMod':
                            chg.key = 'system.v2.attackMasteryLevel';
                            chg.item = this.itemTypes.weapongear.find((item) => item.name === itemName);
                            if (!chg.item) chg.item = this.itemTypes.missilegear.find((it) => it.name === itemName);
                            break;

                        case 'system.v2.itemDMLMod':
                            chg.key = 'system.v2.defenseMasteryLevel';
                            chg.item = this.itemTypes.weapongear.find((it) => it.name === itemName);
                            break;
                    }

                    chg.effect = effect;
                    chg.priority = chg.priority ?? chg.mode * 10;
                    return chg;
                })
            );
        }, []);
        changes.sort((a, b) => a.priority - b.priority);

        // Apply all changes
        for (let change of changes) {
            if (!change.item) continue; // THIS IS AN ERROR; Should generate an error
            change.effect.apply(change.item.item, change);
            const result = this._roundChange(change.item.item, change);
            if (result !== null) overrides[change.key] = result;
        }

        // Expand the set of final overrides
        // foundry.utils.mergeObject(this.overrides, foundry.utils.expandObject(overrides));
        // return Math.max(Math.round(overrides[property] ?? value), 0);
    }

    _roundChange(item, change) {
        // @ts-expect-error
        const current = foundry.utils.getProperty(item, change.key) ?? null;
        // @ts-expect-error
        const ct = foundry.utils.getType(current);
        if (ct === 'number' && !Number.isInteger(current)) {
            const update = Math.round(current + Number.EPSILON);
            // @ts-expect-error
            foundry.utils.setProperty(item, change.key, update);
            return update;
        } else {
            return current;
        }
    }
}
