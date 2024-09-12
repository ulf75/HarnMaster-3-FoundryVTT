import * as combat from './combat.js';
import * as prone from './condition/prone.js';
import * as shocked from './condition/shocked.js';
import * as unconscious from './condition/unconscious.js';
import {HM3} from './config.js';
import {DiceHM3} from './dice-hm3.js';
import {Condition, SkillType} from './hm3-types.js';
import * as utility from './utility.js';

export const SECOND = 1;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 60 * HOUR;
export const INDEFINITE = Number.MAX_SAFE_INTEGER;

/**
 * Create a script macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export function createHM3Macro(data, slot) {
    if (data.type !== 'Item') return true; // Continue normal processing for non-Item documents
    handleItemMacro(data, slot);
    return false;
}

async function handleItemMacro(data, slot) {
    const item = await fromUuid(data.uuid);
    if (!item?.system) {
        ui.notifications.warn('No macro exists for that type of object.');
        return null;
    }

    let title = item.name;
    if (item.actor) {
        title = `${item.actor.name}'s ${item.name}`;
    }

    let cmdSuffix;
    switch (item.type) {
        case 'skill':
            cmdSuffix = `skillRoll("${item.uuid}");`;
            break;

        case 'psionic':
            cmdSuffix = `usePsionicRoll("${item.uuid}");`;
            break;

        case 'spell':
            cmdSuffix = `castSpellRoll("${item.uuid}");`;
            break;

        case 'invocation':
            cmdSuffix = `invokeRitualRoll("${item.uuid}");`;
            break;

        case 'weapongear':
            return await askWeaponMacro(item.uuid, slot, item.img);

        case 'missilegear':
            return await askMissileMacro(item.uuid, slot, item.img);

        case 'injury':
            cmdSuffix = `healingRoll("${item.name}");`;
            break;

        default:
            return null; // Unhandled item, so ignore
    }

    return await applyMacro(title, `await game.hm3.macros.${cmdSuffix}`, slot, item.img, {'hm3.itemMacro': false});
}

async function applyMacro(name, command, slot, img, flags) {
    let macro = [game.macros.values()].find((m) => m.name === name && m.command === command);
    if (!macro) {
        macro = await Macro.create({
            name: name,
            type: 'script',
            img: img,
            command: command,
            flags: flags
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return null;
}

function askWeaponMacro(weaponUuid, slot, img) {
    const item = fromUuidSync(weaponUuid);
    if (!item) {
        ui.notifications.warn(`No weapon with Uuid ${weaponUuid}`);
    }

    const dlghtml = '<p>Select the type of weapon macro to create:</p>';

    let actorName = '';
    if (item.actor) {
        actorName = `${item.actor.name}'s `;
    }

    // Create the dialog window
    return new Promise((resolve) => {
        new Dialog({
            title: 'Select Weapon Macro',
            content: dlghtml.trim(),
            buttons: {
                enhAttackButton: {
                    label: 'Automated Combat',
                    callback: async (html) => {
                        return await applyMacro(`${item.name} Automated Combat`, `await game.hm3.macros.weaponAttack("${weaponUuid}");`, slot, img, {
                            'hm3.itemMacro': false
                        });
                    }
                },
                attackButton: {
                    label: 'Attack',
                    callback: async (html) => {
                        return await applyMacro(
                            `${actorName}${item.name} Attack Roll`,
                            `await game.hm3.macros.weaponAttackRoll("${weaponUuid}");`,
                            slot,
                            img,
                            {'hm3.itemMacro': false}
                        );
                    }
                },
                defendButton: {
                    label: 'Defend',
                    callback: async (html) => {
                        return await applyMacro(
                            `${actorName}${item.name} Defend Roll`,
                            `await game.hm3.macros.weaponDefendRoll("${weaponUuid}");`,
                            slot,
                            img,
                            {'hm3.itemMacro': false}
                        );
                    }
                },
                damageButton: {
                    label: 'Damage',
                    callback: async (html) => {
                        return await applyMacro(
                            `${actorName}${item.name} Damage Roll`,
                            `await game.hm3.macros.weaponDamageRoll("${weaponUuid}");`,
                            slot,
                            img,
                            {'hm3.itemMacro': false}
                        );
                    }
                }
            },
            default: 'enhAttackButton',
            close: () => resolve(false)
        }).render(true);
    });
}

function askMissileMacro(name, slot, img, actorSuffix) {
    const dlghtml = '<p>Select the type of missile macro to create:</p>';

    // Create the dialog window
    return new Promise((resolve) => {
        new Dialog({
            title: 'Select Missile Macro',
            content: dlghtml.trim(),
            buttons: {
                enhAttackButton: {
                    label: 'Automated Combat',
                    callback: async (html) => {
                        return await applyMacro(`${name} Automated Combat`, `game.hm3.macros.missileAttack("${name}");`, slot, img, {
                            'hm3.itemMacro': false
                        });
                    }
                },
                attackButton: {
                    label: 'Attack',
                    callback: async (html) => {
                        return await applyMacro(
                            `${actorName}'s ${name} Attack Roll`,
                            `game.hm3.macros.missileAttackRoll("${name}"${actorSuffix});`,
                            slot,
                            img,
                            {'hm3.itemMacro': false}
                        );
                    }
                },
                damageButton: {
                    label: 'Damage',
                    callback: async (html) => {
                        return await applyMacro(
                            `${actorName}'s ${name} Damage Roll`,
                            `game.hm3.macros.missileDamageRoll("${name}"${actorSuffix});`,
                            slot,
                            img,
                            {'hm3.itemMacro': false}
                        );
                    }
                }
            },
            default: 'enhAttackButton',
            close: () => resolve(false)
        }).render(true);
    });
}

async function getItemAndActor(itemName, myActor, type) {
    let result = {actor: myActor, item: null, speaker: ChatMessage.getSpeaker()};
    if (itemName) {
        result.item = await combat.getItem(itemName, type, myActor);
        myActor = result.item.actor || myActor;

        if (result.item?.type !== type) {
            if (result.item) {
                ui.notifications.warn(
                    `Ignoring ${HM3.ITEM_TYPE_LABEL[type].singular} test because ${result.item.name} is not a ${HM3.ITEM_TYPE_LABEL[type].singular}`
                );
            } else {
                ui.notifications.warn(
                    `Ignoring ${HM3.ITEM_TYPE_LABEL[type].singular} test because no ${HM3.ITEM_TYPE_LABEL[type].singular} found for '${itemName}'`
                );
            }
            return null;
        }
    }

    result = getActor(result);
    if (!result) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    return result;
}

export async function skillRoll(itemName, noDialog = false, myActor = null) {
    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, 'skill');

    const stdRollData = {
        type: `skill-${item.name}`,
        skill: `${item.name}`,
        label: `${item.name} Skill Test`,
        target: item.system.effectiveMasteryLevel,
        notesData: {
            up: actor.system.universalPenalty,
            pp: actor.system.physicalPenalty,
            il: actor.system.eph.totalInjuryLevels || 0,
            fatigue: actor.system.eph.fatigue,
            eml: item.system.effectiveMasteryLevel,
            ml: item.system.masteryLevel,
            sb: item.system.skillBase.value,
            si: item.system.skillIndex
        },
        speaker: speaker,
        fastforward: noDialog,
        notes: item.system.notes,
        effSkillBase: item.system.skillBase.value,
        isCraftOrLore: [SkillType.CRAFT, 'Lore'].includes(item.system.type)
    };
    if (actor.isToken) {
        stdRollData.token = actor.token.id;
    } else {
        stdRollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.preSkillRoll', stdRollData, actor, item);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            item.runCustomMacro(result);
            callOnHooks('hm3.onSkillRoll', actor, result, stdRollData, item);
        }
        return result;
    }
    return null;
}

export async function castSpellRoll(itemName, noDialog = false, myActor = null) {
    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, 'spell');

    const stdRollData = {
        type: `spell-${item.name}`,
        skill: `${item.name}`,
        label: `Casting ${item.name}`,
        target: item.system.effectiveMasteryLevel,
        notesData: {
            up: actor.system.universalPenalty,
            pp: actor.system.physicalPenalty,
            il: actor.system.eph.totalInjuryLevels || 0,
            fatigue: actor.system.eph.fatigue,
            eml: item.system.effectiveMasteryLevel,
            ml: item.system.masteryLevel,
            sb: item.system.skillBase,
            si: item.system.skillIndex,
            spellName: item.name,
            convocation: item.system.convocation,
            level: item.system.level
        },
        speaker: speaker,
        fastforward: noDialog,
        notes: item.system.notes
    };
    if (actor.isToken) {
        stdRollData.token = actor.token.id;
    } else {
        stdRollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.preSpellRoll', stdRollData, actor, item);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            item.runCustomMacro(result);
            callOnHooks('hm3.onSpellRoll', actor, result, stdRollData, item);
        }
        return result;
    }
    return null;
}

export async function invokeRitualRoll(itemName, noDialog = false, myActor = null) {
    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, 'invocation');

    const stdRollData = {
        type: `invocation-${item.name}`,
        skill: `${item.name}`,
        label: `Invoking ${item.name} Ritual`,
        target: item.system.effectiveMasteryLevel,
        notesData: {
            up: actor.system.universalPenalty,
            pp: actor.system.physicalPenalty,
            il: actor.system.eph.totalInjuryLevels || 0,
            fatigue: actor.system.eph.fatigue,
            eml: item.system.effectiveMasteryLevel,
            ml: item.system.masteryLevel,
            sb: item.system.skillBase,
            si: item.system.skillIndex,
            invocationName: item.name,
            diety: item.system.diety,
            circle: item.system.circle
        },
        speaker: speaker,
        fastforward: noDialog,
        notes: item.system.notes
    };
    if (actor.isToken) {
        stdRollData.token = actor.token.id;
    } else {
        stdRollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.preInvocationRoll', stdRollData, actor, item);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            item.runCustomMacro(result);
            callOnHooks('hm3.onInvocationRoll', actor, result, stdRollData, item);
        }
        return result;
    }
    return null;
}

export async function usePsionicRoll(itemName, noDialog = false, myActor = null) {
    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, 'psionic');

    const stdRollData = {
        type: `psionic-${item.name}`,
        skill: `${item.name}`,
        label: `Using ${item.name} Talent`,
        target: item.system.effectiveMasteryLevel,
        notesData: {
            up: actor.system.universalPenalty,
            pp: actor.system.physicalPenalty,
            il: actor.system.eph.totalInjuryLevels || 0,
            fatigue: actor.system.eph.fatigue,
            eml: item.system.effectiveMasteryLevel,
            ml: item.system.masteryLevel,
            sb: item.system.skillBase.value,
            si: item.system.skillIndex,
            psionicName: item.name,
            fatigueCost: item.system.fatigue
        },
        speaker: speaker,
        fastforward: noDialog,
        notes: item.system.notes
    };
    if (actor.isToken) {
        stdRollData.token = actor.token.id;
    } else {
        stdRollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.prePsionicsRoll', stdRollData, actor, item);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            item.runCustomMacro(result);
            callOnHooks('hm3.onPsionicsRoll', actor, result, stdRollData, item);
        }
        return result;
    }
    return null;
}

export async function testAbilityD6Roll(ability, noDialog = false, myActor = null) {
    return testAbilityD6RollAlt({ability, noDialog, myActor});
}

/**
 * Alternative implementation.
 * @param {*} options
 * @returns
 */
export async function testAbilityD6RollAlt(options) {
    options = foundry.utils.mergeObject({noDialog: false, myActor: null, blind: false}, options);

    const actorInfo = getActor({actor: options.myActor, item: null, speaker: ChatMessage.getSpeaker()});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    let abilities;
    if (actorInfo.actor.type === 'character') {
        abilities = Object.keys(game.model.Actor.character.abilities);
    } else if (actorInfo.actor.type === 'creature') {
        abilities = Object.keys(game.model.Actor.creature.abilities);
    } else {
        ui.notifications.warn(`${actorInfo.name} does not have ability scores.`);
        return null;
    }
    if (!options.ability || !abilities.includes(options.ability)) return null;

    const stdRollData = {
        type: `${options.ability}-d6`,
        skill: `${options.ability[0].toUpperCase()}${options.ability.slice(1)}`,
        label: `d6 ${options.ability[0].toUpperCase()}${options.ability.slice(1)} Roll`,
        target: actorInfo.actor.system.abilities[options.ability].effective,
        numdice: 3,
        notesData: {},
        speaker: actorInfo.speaker,
        fastforward: options.noDialog,
        notes: ''
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
    } else {
        stdRollData.actor = actorInfo.actor.id;
    }

    const hooksOk = Hooks.call('hm3.preAbilityRollD6', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d6Roll(stdRollData);
        if (result) {
            actorInfo.actor.runCustomMacro(result);
            callOnHooks('hm3.onAbilityRollD6', result, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function testAbilityD100Roll(ability, noDialog = false, myActor = null, multiplier = 5) {
    return testAbilityD100RollAlt({ability, noDialog, myActor, multiplier});
}

/**
 * Alternative implementation.
 * @param {*} options
 * @returns
 */
export async function testAbilityD100RollAlt(options) {
    options = foundry.utils.mergeObject(
        {ability: null, noDialog: false, myActor: null, multiplier: 5, blind: false, private: false, fluff: null, fluffResult: null},
        options
    );

    const actorInfo = getActor({actor: options.myActor, item: null, speaker: ChatMessage.getSpeaker({actor: options.myActor})});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    let abilities;
    if (actorInfo.actor.type === 'character') {
        abilities = Object.keys(game.model.Actor.character.abilities);
    } else if (actorInfo.actor.type === 'creature') {
        abilities = Object.keys(game.model.Actor.creature.abilities);
    } else {
        ui.notifications.warn(`${actorInfo.actor.name} does not have ability scores.`);
        return null;
    }
    if (!options.ability || !abilities.includes(options.ability)) return null;

    const stdRollData = {
        type: `${options.ability}-d100`,
        skill: `${options.ability[0].toUpperCase()}${options.ability.slice(1)}`,
        label: `d100 ${options.ability[0].toUpperCase()}${options.ability.slice(1)} Roll`,
        effSkillBase: Math.max(1, actorInfo.actor.system.abilities[options.ability].effective),
        target: Math.max(5, actorInfo.actor.system.abilities[options.ability].effective * options.multiplier),
        notesData: {},
        speaker: actorInfo.speaker,
        fastforward: options.noDialog,
        notes: '',
        isAbility: true,
        multiplier: options.multiplier,
        blind: options.blind,
        private: options.private,
        fluff: options.fluff,
        fluffResult: options.fluffResult
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
    } else {
        stdRollData.actor = actorInfo.actor.id;
    }

    const hooksOk = Hooks.call('hm3.preAbilityRollD100', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            actorInfo.actor.runCustomMacro(result);
            callOnHooks('hm3.onAbilityRollD100', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function weaponDamageRoll(itemName, aspect = null, myActor = null) {
    if (aspect) {
        if (!HM3.allowedAspects.includes(aspect)) {
            ui.notifications.warn(`Invalid aspect requested on damage roll: ${aspect}`);
            return null;
        }
    }

    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, 'weapongear');

    const rollData = {
        notesData: {
            up: actor.system.universalPenalty,
            pp: actor.system.physicalPenalty,
            il: actor.system.eph.totalInjuryLevels || 0,
            fatigue: actor.system.eph.fatigue,
            weaponName: item.name
        },
        weapon: item.name,
        data: actor,
        speaker: speaker,
        aspect: aspect ? aspect : null,
        notes: item.system.notes
    };
    if (actor.isToken) {
        rollData.token = actor.token.id;
    } else {
        rollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.preDamageRoll', rollData, actor);
    if (hooksOk) {
        const result = await DiceHM3.damageRoll(rollData);
        if (result) {
            callOnHooks('hm3.onDamageRoll', actor, result, rollData);
        }
        return result;
    }
    return null;
}

export async function missileDamageRoll(itemName, range = null, myActor = null) {
    myActor &&= myActor instanceof Actor ? myActor : await fromUuid(myActor);
    if (range) {
        if (!HM3.allowedRanges.includes(range)) {
            ui.notifications.warn(`Invalid range requested on damage roll: ${range}`);
            return null;
        }
    }

    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, 'missilegear');

    const rollData = {
        notesData: {
            up: actor.system.universalPenalty,
            pp: actor.system.physicalPenalty,
            il: actor.system.eph.totalInjuryLevels || 0,
            fatigue: actor.system.eph.fatigue,
            missileName: item.name,
            aspect: item.system.weaponAspect
        },
        name: item.name,
        aspect: item.system.weaponAspect,
        defaultRange: range,
        impactShort: item.system.impact.short,
        impactMedium: item.system.impact.medium,
        impactLong: item.system.impact.long,
        impactExtreme: item.system.impact.extreme,
        data: actor,
        speaker: speaker,
        notes: item.system.notes
    };
    if (actor.isToken) {
        rollData.token = actor.token.id;
    } else {
        rollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.preMissileDamageRoll', rollData, actor, item);
    if (hooksOk) {
        const result = await DiceHM3.missileDamageRoll(rollData);
        if (result) {
            callOnHooks('hm3.onMissileDamageRoll', actor, result, rollData);
        }
        return result;
    }
    return null;
}

export async function weaponAttackRoll(itemName, noDialog = false, myActor = null) {
    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, 'weapongear');

    const stdRollData = {
        label: `${item.name} Attack`,
        target: item.system.attackMasteryLevel,
        notesData: {
            up: actor.system.universalPenalty,
            pp: actor.system.physicalPenalty,
            il: actor.system.eph.totalInjuryLevels || 0,
            fatigue: actor.system.eph.fatigue,
            ml: item.system.masteryLevel,
            sb: item.system.skillBase,
            si: item.system.skillIndex,
            weaponName: item.name,
            attack: item.system.attack,
            atkMod: item.system.attackModifier,
            aml: item.system.attackMasteryLevel
        },
        speaker: speaker,
        fastforward: noDialog,
        notes: item.system.notes
    };
    if (actor.isToken) {
        stdRollData.token = actor.token.id;
    } else {
        stdRollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.preWeaponAttackRoll', stdRollData, actor, item);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            callOnHooks('hm3.onWeaponAttackRoll', actor, result, stdRollData, item);
        }
        return result;
    }
    return null;
}

export async function weaponDefendRoll(itemName, noDialog = false, myActor = null) {
    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, 'weapongear');

    let outnumberedMod = 0;
    if (actor.system?.eph?.outnumbered > 1) {
        outnumberedMod = Math.floor(actor.system.eph.outnumbered - 1) * -10;
    }

    const stdRollData = {
        label: `${item.name} Defense`,
        target: item.system.defenseMasteryLevel,
        modifier: outnumberedMod,
        notesData: {
            up: actor.system.universalPenalty,
            pp: actor.system.physicalPenalty,
            il: actor.system.eph.totalInjuryLevels || 0,
            fatigue: actor.system.eph.fatigue,
            ml: item.system.masteryLevel,
            sb: item.system.skillBase,
            si: item.system.skillIndex,
            weaponName: item.name,
            defense: item.system.defense,
            dml: item.system.defenseMasteryLevel
        },
        speaker: speaker,
        fastforward: noDialog,
        notes: item.system.notes
    };
    if (actor.isToken) {
        stdRollData.token = actor.token.id;
    } else {
        stdRollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.preWeaponDefendRoll', stdRollData, actor, item);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            callOnHooks('hm3.onWeaponDefendRoll', actor, result, stdRollData, item);
        }
        return result;
    }
    return null;
}

export async function missileAttackRoll(itemName, myActor = null) {
    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, 'missilegear');

    const rollData = {
        notesData: {
            up: actor.system.universalPenalty,
            pp: actor.system.physicalPenalty,
            il: actor.system.eph.totalInjuryLevels || 0,
            fatigue: actor.system.eph.fatigue,
            missileName: item.name
        },
        name: item.name,
        target: item.system.attackMasteryLevel,
        aspect: item.system.weaponAspect,
        rangeShort: item.system.range.short,
        rangeMedium: item.system.range.medium,
        rangeLong: item.system.range.long,
        rangeExtreme: item.system.range.extreme,
        data: item,
        speaker: speaker,
        notes: item.system.notes
    };
    if (actor.isToken) {
        rollData.token = actor.token.id;
    } else {
        rollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.preMissileAttackRoll', rollData, actor, item);
    if (hooksOk) {
        const result = await DiceHM3.missileAttackRoll(rollData);
        if (result) {
            callOnHooks('hm3.onMissileAttackRoll', actor, result, rollData, item);
        }
        return result;
    }
    return null;
}

export async function injuryRoll(myActor = null, rollData = {}) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: ChatMessage.getSpeaker()});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    rollData.notesData = {};
    rollData.actor = actorInfo.actor;
    rollData.speaker = actorInfo.speaker;
    rollData.name = actorInfo.actor.token ? actorInfo.actor.token.name : actorInfo.actor.name;
    rollData.notes = '';

    const hooksOk = Hooks.call('hm3.preInjuryRoll', rollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.injuryRoll(rollData);
        if (result) {
            callOnHooks('hm3.onInjuryRoll', actorInfo.actor, result, rollData);
        }
        return result;
    }
    return null;
}

export async function healingRoll(itemName, noDialog = false, myActor = null) {
    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, 'injury');

    const stdRollData = {
        type: 'healing',
        label: `${item.name} Healing Roll`,
        target: item.system.healRate * actor.system.endurance,
        notesData: {
            up: actor.system.universalPenalty,
            pp: actor.system.physicalPenalty,
            il: actor.system.eph.totalInjuryLevels || 0,
            fatigue: actor.system.eph.fatigue,
            endurance: actor.system.endurance,
            injuryName: item.name,
            healRate: item.system.healRate
        },
        speaker: speaker,
        fastforward: noDialog,
        notes: item.system.notes
    };
    if (actor.isToken) {
        stdRollData.token = actor.token.id;
    } else {
        stdRollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.preHealingRoll', stdRollData, actor, item);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        item.runCustomMacro(result);
        if (result) {
            callOnHooks('hm3.onHealingRoll', actor, result, stdRollData, item);
        }
        return result;
    }
    return null;
}

export async function dodgeRoll(noDialog = false, myActor = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: ChatMessage.getSpeaker()});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    const stdRollData = {
        type: 'dodge',
        label: `Dodge Roll`,
        target: actorInfo.actor.system.dodge,
        notesData: {},
        speaker: actorInfo.speaker,
        fastforward: noDialog,
        notes: ''
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
    } else {
        stdRollData.actor = actorInfo.actor.id;
    }

    const hooksOk = Hooks.call('hm3.preDodgeRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            callOnHooks('hm3.onDodgeRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function shockRoll(noDialog = false, myActor = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: ChatMessage.getSpeaker()});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    let hooksOk = false;
    let stdRollData = null;
    stdRollData = {
        type: 'shock',
        label: `Shock Roll`,
        target: actorInfo.actor.system.endurance,
        numdice: actorInfo.actor.system.universalPenalty,
        notesData: {},
        speaker: actorInfo.speaker,
        fastforward: noDialog,
        notes: ''
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
    } else {
        stdRollData.actor = actorInfo.actor.id;
    }

    hooksOk = Hooks.call('hm3.preShockRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d6Roll(stdRollData);
        actorInfo.actor.runCustomMacro(result);
        if (result) {
            callOnHooks('hm3.onShockRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function stumbleRoll(noDialog = false, myActor = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: ChatMessage.getSpeaker()});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    const stdRollData = {
        type: 'stumble',
        label: `${actorInfo.actor.isToken ? actorInfo.actor.token.name : actorInfo.actor.name} Stumble Roll`,
        target: actorInfo.actor.system.eph.stumbleTarget,
        numdice: 3,
        notesData: {},
        speaker: actorInfo.speaker,
        fastforward: noDialog,
        notes: ''
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
    } else {
        stdRollData.actor = actorInfo.actor.id;
    }

    const hooksOk = Hooks.call('hm3.preStumbleRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d6Roll(stdRollData);
        if (result) {
            actorInfo.actor.runCustomMacro(result);
            callOnHooks('hm3.onStumbleRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function fumbleRoll(noDialog = false, myActor = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: ChatMessage.getSpeaker()});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    const stdRollData = {
        type: 'fumble',
        label: `${actorInfo.actor.isToken ? actorInfo.actor.token.name : actorInfo.actor.name} Fumble Roll`,
        target: actorInfo.actor.system.eph.fumbleTarget,
        numdice: 3,
        notesData: {},
        speaker: actorInfo.speaker,
        fastforward: noDialog,
        notes: ''
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
    } else {
        stdRollData.actor = actorInfo.actor.id;
    }

    const hooksOk = Hooks.call('hm3.preFumbleRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d6Roll(stdRollData);
        if (result) {
            actorInfo.actor.runCustomMacro(result);
            callOnHooks('hm3.onFumbleRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

/**
 *
 * @param {string} atkTokenId
 * @param {string} defTokenId
 * @param {number} atkDice
 * @param {number} defDice
 * @returns
 */
export async function throwDownRoll(atkTokenId, defTokenId, atkDice, defDice) {
    const atkToken = canvas.tokens.get(atkTokenId);
    if (!atkToken) {
        ui.notifications.warn(`Attacker ${atkToken.name} could not be found on canvas.`);
        return null;
    }

    const defToken = canvas.tokens.get(defTokenId);
    if (!defToken) {
        ui.notifications.warn(`Defender ${defToken.name} could not be found on canvas.`);
        return null;
    }

    const hooksOk = Hooks.call('hm3.preThrowDownRoll', atkToken, defToken);
    if (hooksOk) {
        let atkResult = 0,
            defResult = 0;
        // re-roll ties
        while (atkResult === defResult) {
            // House rule: To make GRAPPLE more attractive and effective, the player who starts
            // the grapple receives more dice according to the success result (one or two more).
            atkResult = d6(3 + atkDice) + atkToken.actor.system.abilities.strength.effective;
            defResult = d6(3 + defDice) + defToken.actor.system.abilities.strength.effective;
        }

        let ata = false,
            dta = false,
            resultDesc = '',
            goProne;
        if (atkResult > defResult) {
            // Attacker has thrown the defender to the ground and wins a Tactical Advantage.
            goProne = async () => await createCondition(defToken, Condition.PRONE);
            resultDesc = `${atkToken.name} has thrown ${defToken.name} to the ground and wins a Tactical Advantage.`;
            ata = true;
        } else {
            // Defender has thrown the attacker to the ground and wins a Tactical Advantage.
            goProne = async () => await createCondition(atkToken, Condition.PRONE);
            resultDesc = `${defToken.name} has thrown ${atkToken.name} to the ground and wins a Tactical Advantage.`;
            dta = true;
        }

        const chatData = {
            ata,
            atkTokenId: atkToken.id,
            attacker: atkToken.name,
            attackRoll: atkResult,
            defender: defToken.name,
            defenseRoll: defResult,
            defTokenId: defToken.id,
            dta,
            hasAttackHit: false,
            resultDesc,
            title: `Throw Down Roll`,
            visibleAtkActorId: atkToken.actor.id,
            visibleDefActorId: defToken.actor.id
        };

        let chatTemplate = 'systems/hm3/templates/chat/attack-result-card.html';

        const html = await renderTemplate(chatTemplate, chatData);

        let messageData = {
            content: html.trim(),
            sound: CONFIG.sounds.dice,
            speaker: ChatMessage.getSpeaker(),
            user: game.user.id
        };

        // Create a chat message
        await ChatMessage.create(messageData, {});
        await goProne();

        callOnHooks('hm3.onThrowDownRoll', atkToken, defToken, {atkResult, defResult});
    }
    return null;
}

export async function genericDamageRoll(myActor = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: ChatMessage.getSpeaker()});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    const rollData = {
        weapon: '',
        data: actorInfo.actor,
        speaker: actorInfo.speaker,
        notesData: {},
        notes: ''
    };
    if (actorInfo.actor.isToken) {
        rollData.token = actorInfo.actor.token.id;
    } else {
        rollData.actor = actorInfo.actor.id;
    }

    const hooksOk = Hooks.call('hm3.preDamageRoll', rollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.damageRoll(rollData);
        if (result) {
            callOnHooks('hm3.onDamageRoll', actorInfo.actor, result, rollData);
        }
        return result;
    }
    return null;
}

export async function changeFatigue(newValue, myActor = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: ChatMessage.getSpeaker()});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    const updateData = {};
    if (/^\s*[+-]/.test(newValue)) {
        // relative change
        const changeValue = parseInt(newValue, 10);
        if (!isNaN(changeValue)) updateData['system.fatigue'] = Math.max(actorInfo.actor.system.fatigue + changeValue, 0);
    } else {
        const value = parseInt(newValue, 10);
        if (!isNaN(value)) updateData['system.fatigue'] = value;
    }
    if (typeof updateData['system.fatigue'] !== 'undefined') {
        await actorInfo.actor.update(updateData);
    }

    return true;
}

export async function changeMissileQuanity(missileName, newValue, myActor = null) {
    myActor &&= myActor instanceof Actor ? myActor : await fromUuid(myActor);
    const missile = await combat.getItem(missileName, 'missilegear', myActor);
    const actorParam = {actor: myActor, item: null, speaker: ChatMessage.getSpeaker()};

    if (missile?.type === 'missilegear') {
        if (missile.parent) {
            actorParam.actor = missile.parent;
            actorParam.speaker = ChatMessage.getSpeaker({actor: missile.parent});
        }
    }

    const actorInfo = getActor(result, myActor);
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    if (!missile) {
        ui.notifications.warn(`${missileName} could not be found in the list of missiles for ${actorInfo.actor.name}.`);
        return null;
    }

    const updateData = {};
    if (/^\s*[+-]/.test(newValue)) {
        // relative change
        const changeValue = parseInt(newValue, 10);
        if (!isNaN(changeValue)) updateData['system.quantity'] = Math.max(missile.system.quantity + changeValue, 0);
    } else {
        const value = parseInt(newValue, 10);
        if (!isNaN(value)) updateData['system.quantity'] = value;
    }

    if (typeof updateData['system.quantity'] !== 'undefined') {
        const item = actorInfo.actor.items.get(missile.id);
        await item.update(updateData);
    }
    return true;
}

export async function setSkillDevelopmentFlag(skillName, myActor = null) {
    myActor &&= myActor instanceof Actor ? myActor : await fromUuid(myActor);
    const skill = await combat.getItem(skillName, 'skill', myActor);
    let speaker = myActor instanceof Actor ? ChatMessage.getSpeaker({actor: myActor}) : ChatMessage.getSpeaker();

    if (skill?.type === 'skill') {
        if (skill.parent) {
            speaker = ChatMessage.getSpeaker({actor: skill.parent});
        }
    }

    const actor = getActor(result, myActor);
    if (!actor) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    if (!skill) {
        ui.notifications.warn(`${skillName} could not be found in the list of skills for ${actor.name}.`);
        return null;
    }

    if (!actor.isOwner) {
        ui.notifications.warn(`You are not an owner of ${actor.name}, so you may not set the skill development flag.`);
        return null;
    }

    if (!skill.system.improveFlag) {
        const updateData = {'system.improveFlag': true};
        await skill.update(updateData);
    }

    return true;
}

/*--------------------------------------------------------------*/
/*        AUTOMATED COMBAT                                      */
/*--------------------------------------------------------------*/

export async function weaponAttack(itemName = null, noDialog = false, myToken = null, forceAllow = false) {
    const combatant = getTokenInCombat(myToken, forceAllow);
    if (!combatant) return null;

    const targetToken = getUserTargetedToken(combatant);
    if (!targetToken) return null;

    let weapon = null;
    if (itemName) {
        weapon = await combat.getItem(itemName, 'weapongear', combatant.actor);
    }

    // If an attack is carried out unarmed, you can select the GRAPPLE option.
    const unarmed = weapon?.system.assocSkill.toLowerCase().includes('unarmed') || false;

    const hooksOk = Hooks.call('hm3.preMeleeAttack', combatant, targetToken, weapon, unarmed);
    if (hooksOk) {
        const result = await combat.meleeAttack(combatant.token, targetToken, weapon, unarmed);
        Hooks.call('hm3.onMeleeAttack', result, combatant, targetToken, weapon, unarmed);
        return result;
    }
    return null;
}

export async function missileAttack(itemName = null, noDialog = false, myToken = null, forceAllow = false) {
    const combatant = getTokenInCombat(myToken, forceAllow);
    if (!combatant) return null;

    const targetToken = getUserTargetedToken(combatant);
    if (!targetToken) return null;

    let missile = null;
    if (itemName) {
        missile = await combat.getItem(itemName, 'missilegear', combatant.actor);
    }

    const hooksOk = Hooks.call('hm3.preMissileAttack', combatant, targetToken, missile);
    if (hooksOk) {
        const result = await combat.missileAttack(combatant.token, targetToken, missile);
        Hooks.call('hm3.onMissileAttack', result, combatant, targetToken, missile);
        return result;
    }
    return null;
}

/**
 * Resume the attack with the defender performing the "Counterstrike" defense.
 * Note that this defense is only applicable to melee attacks.
 *
 * @param {*} atkTokenId Token representing the attacker
 * @param {*} defTokenId Token representing the defender/counterstriker
 * @param {*} atkWeaponName Name of the weapon the attacker is using
 * @param {*} atkEffAML The effective AML (Attack Mastery Level) of the attacker after modifiers applied
 * @param {*} atkAim Attack aim ("High", "Mid", "Low")
 * @param {*} atkAspect Weapon aspect ("Blunt", "Edged", "Piercing")
 * @param {*} atkImpactMod Additional modifier to impact
 * @param {boolean} isGrappleAtk
 */
export async function meleeCounterstrikeResume(atkTokenId, defTokenId, atkWeaponName, atkEffAML, atkAim, atkAspect, atkImpactMod, isGrappleAtk) {
    const atkToken = canvas.tokens.get(atkTokenId);
    if (!atkToken) {
        ui.notifications.warn(`Attacker ${atkToken.name} could not be found on canvas.`);
        return null;
    }

    const defToken = canvas.tokens.get(defTokenId);
    if (!defToken) {
        ui.notifications.warn(`Defender ${defToken.name} could not be found on canvas.`);
        return null;
    }

    const hooksOk = Hooks.call(
        'hm3.preMeleeCounterstrikeResume',
        atkToken,
        defToken,
        atkWeaponName,
        atkEffAML,
        atkAim,
        atkAspect,
        atkImpactMod,
        isGrappleAtk
    );
    if (hooksOk) {
        const result = await combat.meleeCounterstrikeResume(
            atkToken,
            defToken,
            atkWeaponName,
            atkEffAML,
            atkAim,
            atkAspect,
            atkImpactMod,
            isGrappleAtk
        );
        Hooks.call(
            'hm3.onMeleeCounterstrikeResume',
            result,
            atkToken,
            defToken,
            atkWeaponName,
            atkEffAML,
            atkAim,
            atkAspect,
            atkImpactMod,
            isGrappleAtk
        );
        return result;
    }
    return null;
}

/**
 * Resume the attack with the defender performing the "Dodge" defense.
 *
 * @param {*} atkTokenId Token representing the attacker
 * @param {*} defTokenId Token representing the defender
 * @param {*} type Type of attack: "melee" or "missile"
 * @param {*} weaponName Name of the weapon the attacker is using
 * @param {*} effAML The effective AML (Attack Mastery Level) of the attacker after modifiers applied
 * @param {*} aim Attack aim ("High", "Mid", "Low")
 * @param {*} aspect Weapon aspect ("Blunt", "Edged", "Piercing")
 * @param {*} impactMod Additional modifier to impact
 */
export async function dodgeResume(atkTokenId, defTokenId, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk) {
    const atkToken = canvas.tokens.get(atkTokenId);
    if (!atkToken) {
        ui.notifications.warn(`Attacker ${atkToken.name} could not be found on canvas.`);
        return null;
    }

    const defToken = canvas.tokens.get(defTokenId);
    if (!defToken) {
        ui.notifications.warn(`Defender ${defToken.name} could not be found on canvas.`);
        return null;
    }

    const hooksOk = Hooks.call('hm3.preDodgeResume', atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk);
    if (hooksOk) {
        const result = await combat.dodgeResume(atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk);
        Hooks.call('hm3.onDodgeResume', result, atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk);
        return result;
    }
    return null;
}

/**
 * Resume the attack with the defender performing the "Block" defense.
 *
 * @param {*} atkTokenId Token representing the attacker
 * @param {*} defTokenId Token representing the defender
 * @param {*} type Type of attack: "melee" or "missile"
 * @param {*} weaponName Name of the weapon the attacker is using
 * @param {*} effAML The effective AML (Attack Mastery Level) of the attacker after modifiers applied
 * @param {*} aim Attack aim ("High", "Mid", "Low")
 * @param {*} aspect Weapon aspect ("Blunt", "Edged", "Piercing")
 * @param {*} impactMod Additional modifier to impact
 */
export async function blockResume(atkTokenId, defTokenId, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk) {
    const atkToken = canvas.tokens.get(atkTokenId);
    if (!atkToken) {
        ui.notifications.warn(`Attacker ${atkToken.name} could not be found on canvas.`);
        return null;
    }

    const defToken = canvas.tokens.get(defTokenId);
    if (!defToken) {
        ui.notifications.warn(`Defender ${defToken.name} could not be found on canvas.`);
        return null;
    }

    const hooksOk = Hooks.call('hm3.preBlockResume', atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk);
    if (hooksOk) {
        const result = await combat.blockResume(atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk);
        Hooks.call('hm3.onBlockResume', result, atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk);
        return result;
    }
    return null;
}

/**
 * Resume the attack with the defender performing the "Ignore" defense.
 *
 * @param {*} atkTokenId Token representing the attacker
 * @param {*} defTokenId Token representing the defender
 * @param {*} type Type of attack: "melee" or "missile"
 * @param {*} weaponName Name of the weapon the attacker is using
 * @param {*} effAML The effective AML (Attack Mastery Level) of the attacker after modifiers applied
 * @param {*} aim Attack aim ("High", "Mid", "Low")
 * @param {*} aspect Weapon aspect ("Blunt", "Edged", "Piercing")
 * @param {*} impactMod Additional modifier to impact
 */
export async function ignoreResume(atkTokenId, defTokenId, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk) {
    const atkToken = canvas.tokens.get(atkTokenId);
    if (!atkToken) {
        ui.notifications.warn(`Attacker ${atkToken.name} could not be found on canvas.`);
        return null;
    }

    const defToken = canvas.tokens.get(defTokenId);
    if (!defToken) {
        ui.notifications.warn(`Defender ${defToken.name} could not be found on canvas.`);
        return null;
    }

    const hooksOk = Hooks.call('hm3.preIgnoreResume', atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk);
    if (hooksOk) {
        const result = await combat.ignoreResume(atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk);
        Hooks.call('hm3.onIgnoreResume', result, atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk);
        return result;
    }
    return null;
}

/*--------------------------------------------------------------*/
/*        UTILITY FUNCTIONS                                     */
/*--------------------------------------------------------------*/

/**
 * Determines the identity of the current token/actor that is in combat. If token
 * is specified, tries to use token (and will allow it regardless if user is GM.),
 * otherwise returned token will be the combatant whose turn it currently is.
 *
 * @param {Token} token
 */
function getTokenInCombat(token = null, forceAllow = false) {
    if (token && (game.user.isGM || forceAllow)) {
        const result = {token: token, actor: token.actor};
        return result;
    }

    if (!game.combat || game.combat.combatants.length === 0) {
        ui.notifications.warn(`No active combatant.`);
        return null;
    }

    const combatant = game.combat.combatant;

    if (token && token.id !== combatant.token.id) {
        ui.notifications.warn(`${token.name} cannot perform that action at this time.`);
        return null;
    }

    if (!combatant.actor.isOwner) {
        ui.notifications.warn(`You do not have permissions to control ${combatant.token.name}.`);
        return null;
    }

    token = canvas.tokens.get(combatant.token.id);
    return {token: token, actor: combatant.actor};
}

function getSingleSelectedToken() {
    const numTargets = canvas.tokens?.controlled?.length;
    if (!numTargets) {
        ui.notifications.warn(`No selected tokens on the canvas.`);
        return null;
    }

    if (numTargets > 1) {
        ui.notifications.warn(`There are ${numTargets} selected tokens on the canvas, please select only one`);
        return null;
    }

    return canvas.tokens.controlled[0];
}

function getUserTargetedToken(combatant) {
    const targets = game.user.targets;
    if (!targets?.size) {
        ui.notifications.warn(`No targets selected, you must select exactly one target, combat aborted.`);
        return null;
    } else if (targets.size > 1) {
        ui.notifications.warn(`${targets} targets selected, you must select exactly one target, combat aborted.`);
    }

    const targetToken = Array.from(game.user.targets)[0];

    if (combatant?.token && targetToken.id === combatant.token.id) {
        ui.notifications.warn(`You have targetted the combatant, they cannot attack themself, combat aborted.`);
        return null;
    }

    return targetToken;
}

function getActor({item, actor, speaker} = {}) {
    const result = {item, actor, speaker};
    if (item?.actor) {
        result.actor = item.actor;
        result.speaker = ChatMessage.getSpeaker({actor: result.actor});
    } else {
        // If actor is an Actor, just return it
        if (result.actor instanceof Actor) {
            result.speaker ||= ChatMessage.getSpeaker({actor: result.actor});
        } else {
            if (!result.actor) {
                // If actor was null, lets try to figure it out from the Speaker
                result.speaker = ChatMessage.getSpeaker();
                if (result.speaker?.token) {
                    const token = canvas.tokens.get(result.speaker.token);
                    result.actor = token.actor;
                } else {
                    result.actor = result.speaker?.actor;
                }
                if (!result.actor) {
                    ui.notifications.warn(`No actor selected, roll ignored.`);
                    return null;
                }
            } else {
                result.actor = fromUuidSync(result.actor);
                result.speaker = ChatMessage.getSpeaker({actor: result.actor});
            }

            if (!result.actor) {
                ui.notifications.warn(`No actor selected, roll ignored.`);
                return null;
            }
        }
    }

    if (!result.actor.isOwner) {
        ui.notifications.warn(`You do not have permissions to control ${result.actor.name}.`);
        return null;
    }

    return result;
}

export function callOnHooks(hook, actor, result, rollData, item = null) {
    const rollResult = {
        type: result.type,
        title: result.title,
        origTarget: result.origTarget,
        modifier: (result.plusMinus === '-' ? -1 : 1) * result.modifier,
        modifiedTarget: result.modifiedTarget,
        rollValue: result.rollValue,
        isSuccess: result.isSuccess,
        isCritical: result.isCritical,
        result: result.isSuccess ? (result.isCritical ? 'CS' : 'MS') : result.isCritical ? 'CF' : 'MF',
        description: result.description,
        notes: result.notes
    };

    const foundMacro = game.macros.getName(hook);

    if (foundMacro && !foundMacro.hasPlayerOwner) {
        const token = actor?.isToken ? actor.token : null;

        utility.executeMacroScript(foundMacro, {actor: actor, token: token, rollResult: rollResult, rollData: rollData, item: item});
    }

    if (item) {
        return Hooks.call(hook, actor, rollResult, rollData, item, result);
    } else {
        return Hooks.call(hook, actor, rollResult, rollData, result);
    }
}

/**
 * Calculates the distance between two tokens.
 * @param {number} sourceTokenId The id of token #1.
 * @param {number} destTokenId The id of token #2.
 * @returns
 */
export function distanceBtwnTwoTokens(sourceTokenId, destTokenId) {
    const source = canvas.tokens.get(sourceTokenId).center;
    const dest = canvas.tokens.get(destTokenId).center;

    return canvas.grid.measurePath([source, dest]).distance;
}

/**
 * TODO
 * @param {*} options
 * @returns
 */
export function getAllTokens(options) {
    options = foundry.utils.mergeObject({friendly: true, neutral: true, secret: true, hostile: true}, options);
    return canvas.scene.tokens.contents.filter(
        (t) =>
            (t.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY && options.friendly) ||
            (t.disposition === CONST.TOKEN_DISPOSITIONS.NEUTRAL && options.neutral) ||
            (t.disposition === CONST.TOKEN_DISPOSITIONS.SECRET && options.secret) ||
            (t.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE && options.hostile)
    );
}

/**
 * TODO
 * @param {*} options
 * @returns
 */
export function getSpecificTokens(options) {
    options = foundry.utils.mergeObject({friendly: false, neutral: false, secret: false, hostile: false}, options);
    return getAllTokens(options);
}

/**
 * TODO
 * Kudos: https://stackoverflow.com/questions/37224912/circle-line-segment-collision
 * @param {*} circle
 * @param {*} line
 * @param {*} centerToCenter
 * @returns
 */
export function pathIntersectsCircle(circle, line, centerToCenter = true) {
    const size = canvas.grid.size / canvas.grid.distance;
    const radius = (centerToCenter ? circle.radius : circle.radius + canvas.grid.distance) * size;
    const c = new PIXI.Circle(circle.center.x, circle.center.y, radius);
    const ixs = c.segmentIntersections(line.p1, line.p2);
    if (ixs.length === 0) return null;
    else if (ixs.length === 1) return ixs[0];
    else {
        const d0 = (line.p1.x - ixs[0].x) ** 2 + (line.p1.y - ixs[0].y) ** 2;
        const d1 = (line.p1.x - ixs[1].x) ** 2 + (line.p1.y - ixs[1].y) ** 2;
        return d0 <= d1 ? ixs[0] : ixs[1];
    }
}

/**
 * TODO
 * @param {Token} token
 * @param {string} name
 * @returns
 */
export function hasActiveEffect(token, name, strict = false) {
    return !!getActiveEffect(token, name, strict);
}

/**
 * TODO
 * @param {Token} token
 * @param {string} name
 * @returns
 */
export function getActiveEffect(token, name, strict = false) {
    return strict
        ? token.actor.effects.contents.find((v) => v.name === name)
        : token.actor.effects.contents.find(
              (v) => v.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(v.name.toLowerCase())
          );
}

/**
 * TODO
 * @param {*} effectData -
 * @param {*} changes -
 * @param {*} options -
 * @returns
 */
export async function createActiveEffect(effectData, changes = [], options = {}) {
    effectData = foundry.utils.mergeObject(
        {
            label: null,
            token: null,
            type: null,
            icon: 'icons/svg/aura.svg',
            flags: [],
            postpone: 0,
            startTime: null,
            seconds: null,
            startRound: null,
            startTurn: null,
            rounds: 1,
            turns: 0
        },
        effectData
    );

    // mandatory
    if (!effectData.label || !effectData.token || !effectData.type) {
        console.error('HM3 Macro "createActiveEffect" needs label, token & type as mandatory input!');
        return null;
    }

    options = foundry.utils.mergeObject({selfDestroy: false, unique: false}, options);
    changes = changes.map((change) => {
        change = foundry.utils.mergeObject({key: '', value: 0, mode: 2, priority: null}, change);
        const keys = getObjectKeys(effectData.token.actor.system);
        change.key = 'system.' + keys.find((v) => v.includes(change.key));
        return change;
    });

    if (options.unique && hasActiveEffect(effectData.token, effectData.label)) {
        return null;
    }

    const aeData = {
        label: effectData.label,
        icon: effectData.icon,
        origin: effectData.token.actor.uuid,
        flags: effectData.flags,
        changes
    };

    if (effectData.type === 'GameTime') {
        const postpone = effectData.postpone;
        const startTime = effectData.startTime || game.time.worldTime + postpone;
        const seconds = effectData.seconds === null ? null : effectData.seconds || 1;

        aeData['duration.startTime'] = startTime;
        aeData['duration.seconds'] = seconds;
    } else if (effectData.type === 'Combat' && !!game.combats.active?.current) {
        const startRound = effectData.startRound || game.combats.active.current.round || 1;
        const startTurn = effectData.startTurn || game.combats.active.current.turn || 0;
        const rounds = effectData.rounds;
        const turns = effectData.turns;

        aeData['duration.combat'] = game.combats.active.id;
        aeData['duration.startRound'] = startRound;
        aeData['duration.startTurn'] = startTurn;
        aeData['duration.rounds'] = rounds;
        aeData['duration.turns'] = turns;
    } else {
        return null;
    }

    const effect = await ActiveEffect.create(aeData, {parent: effectData.token.actor});

    if (options.selfDestroy) {
        await effect.setFlag(
            'effectmacro',
            'onDisable.script',
            `game.actors.get('${effectData.token.actor.id}').effects.get('${effect.id}').delete();`
        );
    }

    return effect;
}

/**
 * TODO
 * @param {Token} token
 * @param {string} condition
 * @returns
 */
export async function createCondition(token, condition) {
    if (!token) return;

    let effect;
    switch (condition) {
        case Condition.BLINDED:
        case Condition.DEAFENED:
        case Condition.GRAPPLED:
        case Condition.INCAPACITATED:
            console.info(`HM3 | Condition '${condition}' not yet implemented.`);
            break;

        case Condition.PRONE:
            {
                const {effectData, changes, options} = await prone.createProneCondition(token);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        case Condition.SHOCKED:
            {
                const {effectData, changes, options} = await shocked.createShockedCondition(token);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        case Condition.UNCONSCIOUS:
            {
                const {effectData, changes, options} = await unconscious.createUnconsciousCondition(token);
                effect = await createActiveEffect(effectData, changes, options);

                // If in combat, make a SHOCK roll each turn (SKILLS 22, COMBAT 14)
                await effect.setFlag('effectmacro', 'onTurnStart.script', unconscious.getOnTurnStartMacro(token, effect));

                // In addition, the combatant falls prone.
                await createCondition(token, Condition.PRONE);
            }
            break;

        default:
            console.error('HM3 | No valid condition.');
    }

    return effect;
}

/**
 *
 * @param {*} obj
 * @param {string} prefix
 * @returns
 */
export function getObjectKeys(obj, prefix) {
    var isobject = function (x) {
        return Object.prototype.toString.call(x) === '[object Object]';
    };

    var keys = Object.keys(obj);
    prefix = prefix ? prefix + '.' : '';
    return keys.reduce(function (result, key) {
        if (isobject(obj[key])) {
            result = result.concat(getObjectKeys(obj[key], prefix + key));
        } else {
            result.push(prefix + key);
        }
        return result;
    }, []);
}

/**
 * Rolls an arbitrary number of d6.
 * @param {number} count - number of dice
 * @returns
 */
export function d6(count = 1) {
    return dx(6, count);
}

/**
 * Rolls an arbitrary number of d20.
 * @param {number} count - number of dice
 * @returns
 */
export function d20(count = 1) {
    return dx(20, count);
}

/**
 * Rolls an arbitrary number of d100.
 * @param {number} count - number of dice
 * @returns
 */
export function d100(count = 1) {
    return dx(100, count);
}

/**
 * Rolls an arbitrary die.
 * @param {number} x - number of sides of the die
 * @param {number} count - number of dice
 * @returns
 */
export function dx(x, count = 1) {
    let val = 0;
    for (let i = 0; i < count; i++) val += Math.floor(x * foundry.dice.MersenneTwister.random()) + 1;
    return val;
}

/**
 * Returns the between 5 (always success) and 95 (always a failure) clamped value.
 * @param {number} value - The value to be clamped.
 * @returns The clamped value.
 */
export function HM100Check(value) {
    return Math.max(Math.min(Math.round(value), 95), 5);
}

var g;
export async function drawDebugPoint(p) {
    // g = new PIXI.Graphics();
    // game.canvas.addChild(g);
    // g.zIndex = -1;
    // g.beginFill(0xff0000, 1.0).drawCircle(p.x, p.y, 16);
    // const c = new PIXI.Circle(p.x, p.y, 6);
    // const dl = game.canvas.getLayerByEmbeddedName('Drawing');
    // const shape = new foundry.data.RectangleShapeData({x: p.x, y: p.y, width: 5, height: 5});
    // const rs = foundry.canvas.regios.RegionShape.create({data: shape});
    // // const shape = new foundry.data.CircleShapeData({x: p.x, y: p.y, radius: 5});
    // const data = [{x: p.x, y: p.y, fillColor: '#ffffff', shape}];
    // const dd = await DrawingDocument.create(data);
    // const d = dl.createObject(dd);
    return;
}
