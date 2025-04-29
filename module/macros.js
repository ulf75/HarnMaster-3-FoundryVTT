import * as combat from './combat.js';
import * as berserk from './condition/berserk.js';
import * as broken from './condition/broken.js';
import * as cautious from './condition/cautious.js';
import * as desperate from './condition/desperate.js';
import * as dying from './condition/dying.js';
import * as empowered from './condition/empowered.js';
import * as grappled from './condition/grappled.js';
import * as prone from './condition/prone.js';
import * as shocked from './condition/shocked.js';
import * as unconscious from './condition/unconscious.js';
import {HM3} from './config.js';
import {DiceHM3} from './dice-hm3.js';
import {Aspect, Condition, InjurySubtype, ItemType, SkillType} from './hm3-types.js';
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

            if (game.settings.get('hm3', 'autoMarkUsedSkills') && !item.system.improveFlag) {
                item.update({'system.improveFlag': true});
            }
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
    const actorInfo = getActor({actor: myActor, item: null, speaker: null});
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
    const {actor, item, speaker} = await getItemAndActor(itemName, myActor, ItemType.INJURY);
    const subType = item.system.subType || InjurySubtype.HEALING;

    if (subType === InjurySubtype.HEALING && (isNaN(item.system.injuryLevel) || item.system?.injuryLevel < 1 || item.system?.injuryLevel > 5)) {
        ui.notifications.warn(`No valid injury level specified.`);
        return null;
    }

    if (isNaN(item.system.healRate) || item.system?.healRate < 1 || item.system?.healRate > 7) {
        return treatmentRoll(actor, item, speaker);
    }

    // Negligible injury (EE) heals automatically
    if (item.system?.healRate === 7) {
        await item.delete();
        return null;
    }

    const stdRollData = {
        fastforward: noDialog,
        label: `${item.name} Healing Roll`,
        notes: item.system.notes,
        speaker: speaker,
        subType,
        target: item.system.healRate * actor.system.endurance,
        type: 'healing',
        notesData: {
            endurance: actor.system.endurance,
            fatigue: actor.system.eph.fatigue,
            healRate: item.system.healRate,
            il: actor.system.eph.totalInjuryLevels || 0,
            injuryName: item.name,
            pp: actor.system.physicalPenalty,
            up: actor.system.universalPenalty
        }
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
            await heal(item, result);
            callOnHooks('hm3.onHealingRoll', actor, result, stdRollData, item);
        }
        return result;
    }
    return null;
}

async function treatmentRoll(actor, injury, speaker) {
    const treatmentTable = HM3.treatmentTable[injury.system.aspect || Aspect.BLUNT][Math.floor(injury.system.injuryLevel / 2)];

    let fluff =
        `<p><b>Injury:</b> ${treatmentTable.injury}</p><p><b>Description:</b> ${treatmentTable.desc}</p><p><b>Treatment:</b> ${treatmentTable.treatment}</p>`.trim();
    let treatment = '';
    if (treatmentTable.treatment.includes('Surgery')) {
        fluff += `<p><b>Surgery</b> takes some minutes. It requires sharp knives, and a needle and thread for sutures. Anesthetic is highly recommended (patients tend to struggle and whimper otherwise) and disinfectants are a good idea too. Such items may be purchased from good apothecaries and improve <b>Treatment EML 10-20</b>.</p>`;
        treatment += `<p><b>Surgery</b> took ${d6(10)} minutes.</p>`;
    }
    if (treatmentTable.treatment.includes('Compress')) {
        fluff += `<p>Apply cold <b>compress</b> for some minutes. Herbal remedies and balms that reduce swelling add improve <b>Treatment EML 10-20</b>.</p>`;
        treatment += `<p>Cold <b>compress</b> took ${d6(5)} minutes.</p>`;
    }
    if (treatmentTable.treatment.includes('Splint')) {
        fluff += `<p>Setting bone and <b>splinting</b> takes some minutes.</p>`;
        treatment += `<p><b>Splinting</b> took ${d6(5)} minutes.</p>`;
    }
    if (treatmentTable.treatment.includes('Clean') || treatmentTable.treatment.includes('Surgery')) {
        fluff += `<p><b>Cleaning and dressing</b> takes some minutes and requires water and bandages.</p>`;
        treatment += `<p><b>Cleaning and dressing</b> took ${5 * injury.system.injuryLevel} minutes.</p>`;
    }
    if (treatmentTable.treatment.includes('Warming')) {
        fluff += `<p>Gentle <b>warming</b> (blanket, healthy person's flesh, etc.) of the injury for a few hours.</p>`;
        treatment += `<p><b>Warming</b> took ${dx(3)} hours.</p>`;
    }

    const stdRollData = {
        fastforward: false,
        fluff,
        fluffResult: {
            CS: treatment + `<p>Excellent work! ${treatmentTable.cs === 7 ? 'EE' : 'H' + treatmentTable.cs} is the best result possible.</p>`,
            MS: treatment + `<p>Good work. ${treatmentTable.ms === 7 ? 'EE' : 'H' + treatmentTable.ms} is a solid result.</p>`,
            MF: treatment + `<p>Lousy work. H${treatmentTable.mf} is just as bad as without treatment.</p>`,
            CF: treatment + `<p>Catastrophic work! H${treatmentTable.cf} is worse than without treatment.</p>`
        },
        label: `${injury.name} Treatment Roll`,
        notes: injury.system.notes,
        speaker: speaker,
        subType: injury.system.subType,
        target: 0,
        treatmentTable,
        type: 'treatment',
        notesData: {
            endurance: actor.system.endurance,
            fatigue: actor.system.eph.fatigue,
            healRate: injury.system.healRate,
            il: actor.system.eph.totalInjuryLevels || 0,
            injuryName: injury.name,
            pp: actor.system.physicalPenalty,
            up: actor.system.universalPenalty
        }
    };
    if (actor.isToken) {
        stdRollData.token = actor.token.id;
    } else {
        stdRollData.actor = actor.id;
    }

    const hooksOk = Hooks.call('hm3.preTreatmentRoll', stdRollData, actor, injury);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            let success = result.isCritical ? 'c' : 'm';
            success += result.isSuccess ? 's' : 'f';
            const hr = treatmentTable[success];
            await injury.update({'system.healRate': hr});
            callOnHooks('hm3.onTreatmentRoll', actor, result, stdRollData, injury);
        }
        return result;
    }
    return null;
}

async function heal(injury, result) {
    const subType = injury.system.subType || InjurySubtype.HEALING;
    switch (subType) {
        case InjurySubtype.BLOODLOSS:
            // TBD
            break;

        case InjurySubtype.HEALING:
            if (result.isSuccess) {
                const il = injury.system.injuryLevel - (result.isCritical ? 2 : 1);
                if (il <= 0) await injury.delete(); // fully healed
                else await injury.update({'system.injuryLevel': il}); // partially healed
            }
            break;

        case InjurySubtype.DISEASE:
        case InjurySubtype.POISON:
        case InjurySubtype.TOXIN:
        case InjurySubtype.SHOCK:
            let hr;
            if (result.isSuccess) hr = injury.system.healRate + (result.isCritical ? 2 : 1);
            else hr = injury.system.healRate - (result.isCritical ? 2 : 1);
            if (hr >= 6) await injury.delete(); // Fully recovered at HR6
            else if (hr <= 0) {
                // Patient is dead at HR0
            } else await injury.update({'system.healRate': hr}); // partially recovered
            break;
    }
}

export async function dodgeRoll(noDialog = false, myActor = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: null});
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

/**
 * TODO
 * @param {Object} options - Additional options
 * @param {boolean} [options.noDialog=false] -
 * @param {boolean} [options.myActor=null] -
 * @param {boolean} [options.token=null] -
 * @param {boolean} [options.injuryLevel=0] -
 */
export async function killRoll(options) {
    options = foundry.utils.mergeObject({noDialog: false, myActor: null, token: null, injuryLevel: 0}, options);

    const actorInfo = getActor({actor: options.myActor, item: null, speaker: null, token: options.token});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    let hooksOk = false;
    let stdRollData = null;
    stdRollData = {
        fastforward: options.noDialog,
        label: `Kill Roll`,
        notes: '',
        notesData: {},
        numdice: options.injuryLevel,
        speaker: actorInfo.speaker,
        target: actorInfo.actor.system.endurance,
        type: 'kill'
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
        options.token = actorInfo.actor.token;
    } else {
        stdRollData.actor = actorInfo.actor.id;
        stdRollData.token = options.token?.id;
    }

    hooksOk = Hooks.call('hm3.preKillRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d6Roll(stdRollData);
        actorInfo.actor.runCustomMacro(result);

        if (result) {
            if (!result.isSuccess) {
                // DYING!!!
                await options.token?.addCondition(game.hm3.enums.Condition.DYING);
            } else {
                await game.hm3.GmSays(
                    `<b>${options.token.name}</b> just survives this <b>Fatal</b> wound, and makes a normal <b>Shock</b> roll.`,
                    'Combat 14'
                );
            }

            callOnHooks('hm3.onKillRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function shockRoll(noDialog = false, myActor = null, token = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: null, token});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    let hooksOk = false;
    let stdRollData = null;
    stdRollData = {
        fastforward: noDialog,
        label: `Shock Roll`,
        notes: '',
        notesData: {},
        numdice: actorInfo.actor.system.universalPenalty,
        speaker: actorInfo.speaker,
        target: actorInfo.actor.system.endurance,
        type: 'shock'
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
        token = actorInfo.actor.token;
    } else {
        stdRollData.actor = actorInfo.actor.id;
        stdRollData.token = token?.id;
    }

    hooksOk = Hooks.call('hm3.preShockRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d6Roll(stdRollData);
        actorInfo.actor.runCustomMacro(result);

        if (result) {
            const unconscious = token?.hasCondition(Condition.UNCONSCIOUS);
            if (!result.isSuccess) {
                if (!unconscious) {
                    // 1st failed SHOCK roll - combatant faints and gets unconscious
                    await token?.addCondition(Condition.UNCONSCIOUS);
                }
                // Opponent gains a TA
                await combat.setTA();
            } else {
                if (unconscious) {
                    // Combatant is unconscious and regains consciousness
                    token?.disableCondition(Condition.UNCONSCIOUS, 500);
                }
            }

            callOnHooks('hm3.onShockRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function stumbleRoll(noDialog = false, myActor = null, opponentToken = null, token = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: null});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    const stdRollData = {
        fastforward: noDialog,
        label: `${actorInfo.actor.isToken ? actorInfo.actor.token.name : actorInfo.actor.name} Stumble Roll`,
        notes: '',
        notesData: {},
        numdice: 3,
        opponentToken,
        speaker: actorInfo.speaker,
        target: actorInfo.actor.system.eph.stumbleTarget,
        type: 'stumble'
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
        token = actorInfo.actor.token;
    } else {
        stdRollData.actor = actorInfo.actor.id;
        stdRollData.token = token?.id;
    }

    const hooksOk = Hooks.call('hm3.preStumbleRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d6Roll(stdRollData);
        if (result) {
            actorInfo.actor.runCustomMacro(result);
            if (!result.isSuccess) {
                await token?.addCondition(Condition.PRONE);
                // Opponent gains a TA
                await combat.setTA();
            }
            callOnHooks('hm3.onStumbleRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function fumbleRoll(noDialog = false, myActor = null, opponentToken = null, token = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: null});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    const stdRollData = {
        actor: actorInfo.actor,
        fastforward: noDialog,
        label: `${actorInfo.actor.isToken ? actorInfo.actor.token.name : actorInfo.actor.name} Fumble Roll`,
        notes: '',
        notesData: {},
        numdice: 3,
        opponentToken,
        speaker: actorInfo.speaker,
        target: actorInfo.actor.system.eph.fumbleTarget,
        type: 'fumble'
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
        token = actorInfo.actor.token;
    } else {
        stdRollData.actor = actorInfo.actor.id;
        stdRollData.token = token?.id;
    }

    const hooksOk = Hooks.call('hm3.preFumbleRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d6Roll(stdRollData);
        if (result) {
            actorInfo.actor.runCustomMacro(result);
            if (!result.isSuccess) {
                // Opponent gains a TA
                await combat.setTA();
            }
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

        if (ata || dta) {
            // Only one TA per turn
            if (!(await combat.setTA())) {
                ata = false;
                dta = false;
            }
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

export async function moraleRoll(noDialog = false, myActor = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: null});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    const ini = actorInfo.actor.items.find((x) => x.name === 'Initiative');
    if (!ini) {
        ui.notifications.warn(`No Initiative skill for this actor for this action could be determined.`);
        return null;
    }

    let token = actorInfo.token;
    const unconscious = token.hasCondition(Condition.UNCONSCIOUS);
    if (unconscious) {
        ui.notifications.warn(`Token is unconscious.`);
        return null;
    }

    const stdRollData = {
        actor: actorInfo.actor,
        fastforward: noDialog,
        label: `${actorInfo.actor.isToken ? actorInfo.actor.token.name : actorInfo.actor.name} Morale Roll`,
        notes: '',
        notesData: {},
        private: true, // hidden to players
        speaker: actorInfo.speaker,
        target: ini.system.effectiveMasteryLevel,
        type: 'Initiative-d100'
    };

    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
        // token = actorInfo.actor.token;
    } else {
        stdRollData.actor = actorInfo.actor.id;
        // token = actorInfo.actor.prototypeToken;
        // stdRollData.token = token?.id;
    }

    const hooksOk = Hooks.call('hm3.preMoraleRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            actorInfo.actor.runCustomMacro(result);
            if (result.isSuccess && result.isCritical) {
                // CS - Inspired
                await token.addCondition(Condition.EMPOWERED, {oneRound: true});
            } else if (!result.isSuccess && !result.isCritical) {
                // MF - Cautious, turn ends
                await token.addCondition(Condition.CAUTIOUS, {oneRound: true});
                await game.combats.active.nextTurn(500); // delay so that other hooks are executed first
            } else if (!result.isSuccess && result.isCritical) {
                // CF
                const rollObj = new Roll('1d100');
                const roll = await rollObj.evaluate();
                if (roll.total <= 25) {
                    await token.addCondition(Condition.BERSERK);
                } else if (roll.total <= 50) {
                    await token.addCondition(Condition.DESPERATE);
                } else if (roll.total <= 75) {
                    await token.addCondition(Condition.BROKEN);
                } else {
                    await token.addCondition(Condition.CAUTIOUS);
                }
            }
            callOnHooks('hm3.onMoraleRoll', actorInfo.actor, result, stdRollData);
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
 * @param {HarnMasterToken} token
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

function getActor({item, actor, speaker, token} = {}) {
    const result = {item, actor, speaker, token};
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
    if (!result.token) result.token = canvas.tokens.get(result.speaker.token);

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
 * @param {number} targetTokenId The id of token #2.
 * @param {boolean} gridUnits If true, the distance is returned in grid units.
 * @returns
 */
export function distanceBtwnTwoTokens(sourceTokenId, targetTokenId, gridUnits = false) {
    const source = canvas.tokens.get(sourceTokenId)?.center;
    const target = canvas.tokens.get(targetTokenId)?.center;

    if (!source || !target || !canvas.scene || !canvas.scene.grid) return 9999;

    const distance = canvas.grid.measurePath([source, target]).distance;
    if (gridUnits) return utility.truncate(distance / canvas.dimensions.distance, 0);
    return utility.truncate(distance, 0);
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
 * @param {HarnMasterToken} token
 * @param {string} name
 * @returns
 */
export function hasActiveEffect(token, name, strict = false) {
    return !!getActiveEffect(token, name, strict);
}

/**
 * TODO
 * @param {HarnMasterToken} token
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
 * @param {Object} effectData - Data to create the effect
 * @param {Object[]} [effectData.flags=[]] -
 * @param {string} [effectData.icon='icons/svg/aura.svg'] -
 * @param {string} [effectData.label] -
 * @param {number} [effectData.postpone=0] -
 * @param {number} [effectData.rounds=1] -
 * @param {number} [effectData.seconds] -
 * @param {number} [effectData.startRound] -
 * @param {number} [effectData.startTime] -
 * @param {number} [effectData.startTurn] -
 * @param {number} [effectData.token] -
 * @param {number} [effectData.turns=0] -
 * @param {string} [effectData.type] -
 * @param {Object[]} [changes=[]] -
 * @param {Object} options - Additional options
 * @param {boolean} [options.hidden=false] - Non GMs will not see this effect
 * @param {boolean} [options.selfDestroy=false] - The effect deletes itself after completion
 * @param {boolean} [options.unique=false] - The effect is unique and cannot exist more than once
 * @returns {Promise<HarnMasterActiveEffect>}
 */
export async function createActiveEffect(effectData, changes = [], options = {}) {
    effectData = foundry.utils.mergeObject(
        {
            flags: [],
            icon: 'icons/svg/aura.svg',
            label: null,
            postpone: 0,
            rounds: 1,
            seconds: null,
            startRound: null,
            startTime: null,
            startTurn: null,
            token: null,
            turns: 0,
            type: null // 'GameTime' | 'Combat'
        },
        effectData
    );

    // mandatory
    if (!effectData.label || !effectData.token || !effectData.type) {
        console.error('HM3 | Macro "createActiveEffect" needs label, token & type as mandatory input!');
        return null;
    }

    options = foundry.utils.mergeObject({hidden: false, selfDestroy: false, unique: false}, options);

    changes = changes.map((change) => {
        change = foundry.utils.mergeObject({key: '', value: 0, mode: 2, priority: null}, change);
        const keys = getObjectKeys(effectData.token.actor.system);
        change.key = 'system.' + keys.find((v) => v.includes(change.key));
        return change;
    });

    if (options.unique && hasActiveEffect(effectData.token, effectData.label)) {
        if (game.user.isGM) ui.notifications.info(`Effect ${effectData.label} is unique and already exists.`);
        return null;
    }

    const aeData = {
        changes,
        flags: effectData.flags,
        icon: effectData.icon,
        label: effectData.label,
        origin: effectData.token.actor.uuid
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

    if (options.hidden) {
        await effect.setFlag('hm3', 'hidden', true);
    }

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
 * @param {HarnMasterToken} token
 * @param {string} condition
 * @param {Object} [conditionOptions={}] - Options for the condition
 * @param {boolean} [conditionOptions.oneRoll=false] - Only one roll defaults to false
 * @param {boolean} [conditionOptions.oneRound=false] - Only one round defaults to false
 * @param {boolean} [conditionOptions.oneTurn=false] - Only one turn defaults to false
 * @returns
 */
export async function createCondition(token, condition, conditionOptions = {}) {
    if (!token) return;

    conditionOptions = foundry.utils.mergeObject(
        {
            oneRoll: false,
            oneRound: false,
            oneTurn: false
        },
        conditionOptions
    );

    let effect;
    switch (condition) {
        case Condition.BLINDED:
        case Condition.DEAFENED:
        case Condition.INCAPACITATED:
            ui.notifications.info(`Condition '${condition}' not yet implemented.`);
            break;

        // This is a special state of battle frenzy. Any character who enters this mode must take the most
        // aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike.
        // Further Initiative rolls are ignored until the battle ends. (COMBAT 16)
        case Condition.BERSERK:
            {
                const {effectData, changes, options} = await berserk.createCondition(token, conditionOptions);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        // The character is unable to fight in any useful way. The only available options are flight or
        // surrender. Flight is normally preferable; surrender is a last resort. If neither is feasible,
        // the character makes a Rest or Pass action option, but can defend if attacked except that
        // Counterstrike is prohibited. (COMBAT 16)
        case Condition.BROKEN:
            {
                const {effectData, changes, options} = await broken.createCondition(token, conditionOptions);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        // A cautious character will not Engage, must choose Pass if engaged, and cannot select the
        // Counterstrike defense. (COMBAT 16)
        case Condition.CAUTIOUS:
            {
                const {effectData, changes, options} = await cautious.createCondition(token, conditionOptions);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        case Condition.CLOSE_MODE:
            effect = await createActiveEffect(
                {
                    label: Condition.CLOSE_MODE,
                    icon: 'systems/hm3/images/icons/svg/spiked-wall.svg',
                    token,
                    type: 'GameTime',
                    seconds: INDEFINITE,
                    flags: {
                        effectmacro: {
                            onTurnStart: {
                                script: `
                            const token = canvas.tokens.get('${token.id}');
                            const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
                            if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Close Mode</b>, and gets -10 on <b>All</b> attack rolls.", "Combat 11");
                            `
                            }
                        }
                    }
                },
                [{key: 'eph.meleeAMLMod', mode: 2, value: '-10'}],
                {
                    unique: true
                }
            );
            break;

        // Character tries to conclude the battle, one way or the other, as soon as possible. Until
        // the situation changes and a new Initiative Test is passed, the character selects the most
        // aggressive option available. (COMBAT 16)
        case Condition.DESPERATE:
            {
                const {effectData, changes, options} = await desperate.createCondition(token, conditionOptions);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        case Condition.DYING:
            {
                const {effectData, changes, options} = await dying.createCondition(token, conditionOptions);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        // Character selects and executes any Action Option, with a +10 bonus to EML. If the character’s
        // current morale state is non-normal, it returns to normal. (COMBAT 16)
        case Condition.EMPOWERED:
            {
                const {effectData, changes, options} = await empowered.createCondition(token, conditionOptions);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        case Condition.GRAPPLED:
            {
                const {effectData, changes, options} = await grappled.createCondition(token, conditionOptions);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        case Condition.PRONE:
            {
                const {effectData, changes, options} = await prone.createCondition(token, conditionOptions);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        case Condition.SECONDARY_HAND:
            effect = await createActiveEffect(
                {
                    label: Condition.SECONDARY_HAND,
                    icon: 'systems/hm3/images/icons/svg/arm-sling.svg',
                    token,
                    type: 'GameTime',
                    seconds: INDEFINITE,
                    flags: {
                        effectmacro: {
                            onTurnStart: {
                                script: `
                            const token = canvas.tokens.get('${token.id}');
                            const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
                            if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> fights with the <b>Secondary Hand</b>, and gets -10 on <b>All</b> attack rolls.", "Combat 3 & 11");
                            `
                            }
                        }
                    }
                },
                [{key: 'eph.meleeAMLMod', mode: 2, value: '-10'}],
                {
                    unique: true
                }
            );
            break;

        case Condition.SHOCKED:
            {
                const {effectData, changes, options} = await shocked.createCondition(token, conditionOptions);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        case Condition.UNCONSCIOUS:
            {
                const {effectData, changes, options} = await unconscious.createCondition(token, conditionOptions);
                effect = await createActiveEffect(effectData, changes, options);
            }
            break;

        default:
            ui.notifications.error(`${condition} is no valid condition.`);
    }

    return effect;
}

/**
 *
 * @param {Object} injuryData
 * @param {number} [injuryData.aspect='Blunt']
 * @param {Object[]} [injuryData.flags=[]]
 * @param {number} [injuryData.healRate=0]
 * @param {number} [injuryData.injuryLevel=0]
 * @param {string} [injuryData.name]
 * @param {string} [injuryData.notes='']
 * @param {string} [injuryData.subType='healing']
 * @param {Token} [injuryData.token]
 * @param {Object} [options={}]
 * @returns {Promise<HarnMasterItem>}
 */
export async function createInjury(injuryData, options = {}) {
    injuryData = foundry.utils.mergeObject(
        {
            aspect: Aspect.BLUNT,
            flags: [],
            healRate: 0,
            icon: 'systems/hm3/images/icons/svg/injury.svg',
            injuryLevel: 0,
            name: null,
            notes: '',
            subType: InjurySubtype.HEALING, // bloodloss, disease, healing, infection, poison, shock, toxin (different healing rolls)
            token: null
        },
        injuryData
    );
    options = foundry.utils.mergeObject({}, options); // TBD

    // mandatory
    if (!injuryData.name || !injuryData.token) {
        console.error('HM3 | Macro "createInjury" needs name & token as mandatory input!');
        return null;
    }

    let sev;
    if (injuryData.injuryLevel === 1) sev = 'M';
    else if (injuryData.injuryLevel <= 3) sev = 'S';
    else sev = 'G';

    const injury = await Item.create(
        {
            flags: injuryData.flags,
            icon: injuryData.icon,
            name: injuryData.name,
            origin: injuryData.token.actor.uuid,
            type: 'injury',
            system: {
                aspect: injuryData.aspect,
                healRate: injuryData.healRate,
                injuryLevel: injuryData.injuryLevel,
                notes: injuryData.notes,
                severity: sev,
                subType: injuryData.subType
            }
        },
        {parent: injuryData.token.actor}
    );
    injuryData.injuryId = injury.id;

    // await createInjuryHelper(injuryData);

    return injury;
}

/**
 *
 * @param {HarnMasterToken} token
 * @param {string} injuryId
 * @param {string} injuryName
 * @returns
 */
export async function createInjuryHelper(injuryData) {
    const timestamp = SimpleCalendar.api.timestamp();

    let startTime, scDate;
    switch (injuryData.subType) {
        case InjurySubtype.BLOODLOSS: // HR: always H6
        case InjurySubtype.HEALING: // HR: varies, plus half Physician EML
            startTime = SimpleCalendar.api.timestampPlusInterval(timestamp, {day: 5});
            scDate = SimpleCalendar.api.timestampToDate(startTime);
            break;

        case InjurySubtype.DISEASE: // HR: varies
        case InjurySubtype.INFECTION: // HR: varies (same as wound), plus Physician SI
            startTime = SimpleCalendar.api.timestampPlusInterval(timestamp, {day: 1});
            scDate = SimpleCalendar.api.timestampToDate(startTime);
            break;

        case InjurySubtype.POISON: // HR: varies
        case InjurySubtype.TOXIN: // HR: varies
            const minute = injuryData.minute || 5;
            const second = injuryData.second || 0;
            startTime = SimpleCalendar.api.timestampPlusInterval(timestamp, {minute, second});
            break;

        case InjurySubtype.SHOCK: // HR: always H5, plus half Physician EML
            startTime = SimpleCalendar.api.timestampPlusInterval(timestamp, {hour: 4});
            break;

        default:
            console.error('HM3 | Wrong injury subType.');
            break;
    }

    // Make the healing rolls at midnight (besides poison & shock rolls)
    if (scDate) {
        startTime = SimpleCalendar.api.dateToTimestamp({year: scDate.year, month: scDate.month, day: scDate.day, hour: 0, minute: 0, seconds: 0});
    }

    return createActiveEffect(
        {
            label: `Injury Helper (${injuryData.name})`,
            seconds: 1,
            startTime,
            token,
            type: 'GameTime',
            flags: {
                effectmacro: {
                    onDelete: {
                        script: `const token = canvas.tokens.get('${injuryData.token.id}');
if(token.hasInjury('${injuryData.injuryId}'))
    await game.hm3.macros.createInjuryHelper(${injuryData});`
                    }
                }
            }
        },
        [],
        {
            hidden: true,
            selfDestroy: true
        }
    );
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
