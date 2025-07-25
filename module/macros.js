import {ActorHM3} from './actor/actor.js';
import * as combat from './combat.js';
import * as berserk from './condition/berserk.js';
import * as broken from './condition/broken.js';
import * as cautious from './condition/cautious.js';
import * as closemode from './condition/closemode.js';
import * as desperate from './condition/desperate.js';
import * as distracted from './condition/distracted.js';
import * as dying from './condition/dying.js';
import * as empowered from './condition/empowered.js';
import * as grappled from './condition/grappled.js';
import * as inanimate from './condition/inanimate.js';
import * as nofumble from './condition/nofumble.js';
import * as nooutnumbered from './condition/nooutnumbered.js';
import * as nostumble from './condition/nostumble.js';
import * as outnumbered from './condition/outnumbered.js';
import * as prone from './condition/prone.js';
import * as secondaryhand from './condition/secondaryhand.js';
import * as shocked from './condition/shocked.js';
import * as unconscious from './condition/unconscious.js';
import * as weakened from './condition/weakened.js';
import {HM3} from './config.js';
import {DiceHM3} from './hm3-dice.js';
import {TokenDocumentHM3, TokenHM3} from './hm3-token.js';
import {Aspect, Condition, InjuryType, ItemType, SkillType} from './hm3-types.js';
import {Mutex} from './mutex.js';
import * as utility from './utility.js';

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
    const item = fromUuidSync(data.uuid);
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
        case game.hm3.ItemType.SKILL:
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
            return askWeaponMacro(item.uuid, slot, item.img);

        case 'missilegear':
            return askMissileMacro(item.uuid, slot, item.img);

        case 'injury':
            cmdSuffix = `healingRoll("${item.name}");`;
            break;

        default:
            return null; // Unhandled item, so ignore
    }

    return applyMacro(title, `await game.hm3.macros.${cmdSuffix}`, slot, item.img, {'hm3.itemMacro': false});
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
                        return applyMacro(
                            `${item.name} Automated Combat`,
                            `await game.hm3.macros.weaponAttack("${weaponUuid}");`,
                            slot,
                            img,
                            {
                                'hm3.itemMacro': false
                            }
                        );
                    }
                },
                attackButton: {
                    label: 'Attack',
                    callback: async (html) => {
                        return applyMacro(
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
                        return applyMacro(
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
                        return applyMacro(
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
                        return applyMacro(
                            `${name} Automated Combat`,
                            `game.hm3.macros.missileAttack("${name}");`,
                            slot,
                            img,
                            {
                                'hm3.itemMacro': false
                            }
                        );
                    }
                },
                attackButton: {
                    label: 'Attack',
                    callback: async (html) => {
                        return applyMacro(
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
                        return applyMacro(
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

            if (game.settings.get('hm3', 'autoMarkUsedSkills')) {
                item.update({'system.improveFlag': item.system.improveFlag + 1});
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
        {
            ability: null,
            noDialog: false,
            myActor: null,
            multiplier: 5,
            blind: false,
            private: false,
            fluff: null,
            fluffResult: null
        },
        options
    );

    const actorInfo = getActor({
        actor: options.myActor,
        item: null,
        speaker: ChatMessage.getSpeaker({actor: options.myActor})
    });
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
    myActor &&= myActor instanceof Actor ? myActor : fromUuidSync(myActor);
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
    const subType = item.system.subType || InjuryType.HEALING;

    if (
        subType === InjuryType.HEALING &&
        (isNaN(item.system.injuryLevel) || item.system?.injuryLevel < 1 || item.system?.injuryLevel > 5)
    ) {
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
        physicianSkills: actor.getPartySkills('Physician'),
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
    const treatmentTable =
        HM3.treatmentTable[injury.system.aspect || Aspect.BLUNT][Math.floor(injury.system.injuryLevel / 2)];

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
            CS:
                treatment +
                `<p>Excellent work! ${
                    treatmentTable.cs === 7 ? 'EE' : 'H' + treatmentTable.cs
                } is the best result possible.</p>`,
            MS:
                treatment +
                `<p>Good work. ${treatmentTable.ms === 7 ? 'EE' : 'H' + treatmentTable.ms} is a solid result.</p>`,
            MF: treatment + `<p>Lousy work. H${treatmentTable.mf} is just as bad as without treatment.</p>`,
            CF: treatment + `<p>Catastrophic work! H${treatmentTable.cf} is worse than without treatment.</p>`
        },
        label: `${injury.name} Treatment Roll`,
        notes: injury.system.notes,
        physicianSkills: actor.getPartySkills('Physician'),
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
    const subType = injury.system.subType || InjuryType.HEALING;
    switch (subType) {
        case InjuryType.BLOODLOSS:
            // TBD
            break;

        case InjuryType.HEALING:
            if (result.isSuccess) {
                const il = injury.system.injuryLevel - (result.isCritical ? 2 : 1);
                if (il <= 0) await injury.delete(); // fully healed
                else await injury.update({'system.injuryLevel': il}); // partially healed
            }
            break;

        case InjuryType.DISEASE:
        case InjuryType.POISON:
        case InjuryType.TOXIN:
        case InjuryType.SHOCK:
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
                await options.token?.addCondition(game.hm3.Condition.DYING);
            } else {
                await game.hm3.GmSays({
                    text: `<b>${options.token.name}</b> just survives this <b>Fatal</b> wound, and makes a normal <b>Shock</b> roll.`,
                    source: 'Combat 14'
                });
            }

            callOnHooks('hm3.onKillRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function shockRoll(noDialog = false, myActor = null, token = null, mode = 0) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: null, token});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    if (actorInfo.actor?.hasCondition(Condition.INANIMATE)) {
        ui.notifications.warn(`Token is inanimate, and immune to shock.`);
        return null;
    }

    let hooksOk = false;
    const stdRollData = {
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
    if (mode > 0) stdRollData.noTA = true;

    hooksOk = Hooks.call('hm3.preShockRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d6Roll(stdRollData);
        actorInfo.actor.runCustomMacro(result);

        if (result) {
            if (mode === 0 && !result.isSuccess) {
                // 1st failed SHOCK roll - combatant faints and gets unconscious
                await token?.addCondition(Condition.UNCONSCIOUS);
            } else if (mode > 0) {
            }

            callOnHooks('hm3.onShockRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function willShockRoll({myActor = null, noDialog = false, token = null}) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: null, token});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    if (actorInfo.actor?.hasCondition(Condition.INANIMATE)) {
        ui.notifications.warn(`Token is inanimate, and immune to shock.`);
        return null;
    }

    let hooksOk = false;
    const stdRollData = {
        fastforward: noDialog,
        label: `Mental Shock Roll`,
        notes: '',
        notesData: {},
        numdice: actorInfo.actor.system.universalPenalty,
        speaker: actorInfo.speaker,
        target: actorInfo.actor.system.abilities.will.base,
        type: 'willshock'
    };
    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
    } else {
        stdRollData.actor = actorInfo.actor.id;
        stdRollData.token = token?.id;
    }

    hooksOk = Hooks.call('hm3.preWillShockRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d6Roll(stdRollData);

        if (result) {
            callOnHooks('hm3.onWillShockRoll', actorInfo.actor, result, stdRollData);
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

    if (actorInfo.actor?.hasCondition(Condition.NO_STUMBLE)) {
        ui.notifications.warn(`Token has No Stumble feat.`);
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

    if (actorInfo.actor?.hasCondition(Condition.NO_FUMBLE)) {
        ui.notifications.warn(`Token has No Fumble feat.`);
        return null;
    }

    // Sometimes fumble rolls were set for animals with DEX 0. They have to make a stumble roll instead.
    if (actorInfo.actor.system.abilities.dexterity.base <= 0) {
        if (game.user.isGM) ui.notifications.warn(`Fumble target is not set for ${actorInfo.token.name}.`);
        return stumbleRoll(noDialog, myActor, opponentToken, token);
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

        let chatTemplate = 'systems/hm3/templates/chat/attack-result-card.hbs';

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

export async function fallingRoll(noDialog = false, myActor = null, token = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: null});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    let dlgTemplate = 'systems/hm3/templates/dialog/falling-test-dialog.hbs';
    let dialogData = {
        clear: true,
        grabbing: false,
        height: 6,
        modifier: 0
    };

    const dodgeSkill = actorInfo.actor.items.find((item) => item.type === ItemType.SKILL && item.name === 'Dodge');
    const acrobaticsSkill = actorInfo.actor.items.find(
        (item) => item.type === ItemType.SKILL && item.name === 'Acrobatics'
    );

    dialogData.skill = 'Dodge';
    dialogData.skills = [{key: 'Dodge'}];
    if (acrobaticsSkill) {
        dialogData.skill = 'Acrobatics';
        dialogData.skills = [{key: 'Acrobatics'}, {key: 'Dodge'}];
    }

    dialogData.surface = '0';
    dialogData.surfaces = [
        {key: '-3', label: 'Deep Water (3 feet or more) (-3d6)'},
        {key: '-2', label: 'Shallow Water (less than 3 feet) (-2d6)'},
        {key: '-1', label: 'Soft Ground (mud, bog, etc.) (-1d6)'},
        {key: '0', label: 'Normal Ground (grass, earth, etc.) (+0)'},
        {key: '1', label: 'Hard Ground (paving stone, etc.) (+1d6)'},
        {key: '2', label: 'Rocky Ground (+2d6)'}
    ];

    const html = await renderTemplate(dlgTemplate, dialogData);

    // Create the dialog window
    let dlg = await Dialog.prompt({
        content: html.trim(),
        label: 'Roll',
        options: {width: 550},
        title: 'Falling Test',
        callback: async (html) => {
            const form = html[0].querySelector('form');
            const formClear = form.clear.checked;
            const formGrabbing = form.grabbing.checked;
            const formHeight = Number(form.height.value);
            const formModifier = Number(form.modifier.value);
            const formSkill = form.skills.value;
            const formSurface = Number(form.surfaces.value);

            let dice = Math.ceil(formHeight / 10 + Number.EPSILON); // 1d6 per 10 feet of fall
            dice += formSurface; // Add surface modifier

            if (formGrabbing) {
                const effSkillBase = actorInfo.actor.system.abilities.dexterity.effective; // Use Dexterity for grabbing

                const stdRollData = {
                    actor: actorInfo.actor,
                    effSkillBase,
                    fastforward: true,
                    isAbility: true,
                    label: `d100 Dexterity Roll`,
                    multiplier: 5,
                    name: `${actorInfo.token.name} tries to grab something while falling.`,
                    notes: '',
                    notesData: {},
                    numdice: 1,
                    skill: 'Dexterity',
                    speaker: actorInfo.speaker,
                    target: effSkillBase * 5, // Target is Dexterity EML * 5
                    type: 'dexterity-d100'
                };
                if (actorInfo.actor.isToken) {
                    stdRollData.token = actorInfo.actor.token.id;
                } else {
                    stdRollData.actor = actorInfo.actor.id;
                    stdRollData.token = token?.id;
                }

                stdRollData.addlInfoCallback = (result) => {
                    const progress = `Fall modifier:`;

                    if (result.isSuccess) {
                        if (result.isCritical) {
                            dice += -3; // Critical success reduces fall damage by 3d6
                            return `<p>${progress} -3d6</p>`;
                        } else {
                            dice += -2; // Success reduces fall damage by 2d6
                            return `<p>${progress} -2d6</p>`;
                        }
                    } else {
                        if (result.isCritical) {
                            return `<p>${actorInfo.token.name} has wrenched one arm, giving a Blunt Minor Injury (M1).</p>`;
                        } else {
                            return `<p>No effect</p>`;
                        }
                    }
                };

                const dex = await DiceHM3.d100StdRoll(stdRollData);
                if (!dex.isSuccess && dex.isCritical) {
                    await DiceHM3.injuryRoll({
                        actor: actorInfo.actor,
                        aim: 'Mid',
                        aspect: Aspect.BLUNT,
                        impact: 1,
                        items: actorInfo.actor.items,
                        location: `${dx(2) === 1 ? 'Right' : 'Left'} Shoulder`,
                        name: `Character has wrenched one arm.`,
                        noArmor: true,
                        speaker: actorInfo.speaker
                    });
                }
            }

            let success = false;
            if (formClear && formHeight > 15) {
                let target =
                    formSkill === 'Acrobatics'
                        ? acrobaticsSkill.system.effectiveMasteryLevel
                        : dodgeSkill.system.effectiveMasteryLevel;
                target = game.hm3.macros.HM100Check(target + formModifier);

                const stdRollData = {
                    actor: actorInfo.actor,
                    fastforward: true,
                    label: `${formSkill} Skill Test`,
                    name: `${actorInfo.token.name} tries to avoid falling damage.`,
                    notes: '',
                    notesData: {},
                    numdice: 1,
                    skill: formSkill,
                    speaker: actorInfo.speaker,
                    target,
                    type: 'falling'
                };
                if (actorInfo.actor.isToken) {
                    stdRollData.token = actorInfo.actor.token.id;
                } else {
                    stdRollData.actor = actorInfo.actor.id;
                    stdRollData.token = token?.id;
                }

                stdRollData.addlInfoCallback = (result) => {
                    const progress = `Fall modifier:`;
                    const CS = {'Dodge': -2, 'Acrobatics': -3};
                    const MS = {'Dodge': -1, 'Acrobatics': -2};
                    const MF = {'Dodge': 1, 'Acrobatics': 0};
                    const CF = {'Dodge': 2, 'Acrobatics': 1};

                    if (result.isSuccess) {
                        if (result.isCritical) {
                            dice += CS[stdRollData.skill];
                            return `<p>${progress} ${CS[stdRollData.skill]}d6</p>`;
                        } else {
                            dice += MS[stdRollData.skill];
                            return `<p>${progress} ${MS[stdRollData.skill]}d6</p>`;
                        }
                    } else {
                        if (result.isCritical) {
                            dice += CF[stdRollData.skill];
                            return `<p>${progress} +${CF[stdRollData.skill]}d6</p>`;
                        } else {
                            dice += MF[stdRollData.skill];
                            return `<p>${progress} +${MF[stdRollData.skill]}d6</p>`;
                        }
                    }
                };

                const dodge = await DiceHM3.d100StdRoll(stdRollData);
                success = dodge.isSuccess;
            }

            dice = Math.max(dice, 0);
            await DiceHM3.injuryRoll({
                actor: actorInfo.actor,
                aim: success ? 'Low' : 'Mid',
                aspect: Aspect.BLUNT,
                impact: (await new Roll(dice + 'd6').evaluate()).total,
                items: actorInfo.actor.items,
                name: `Falling from ${formHeight} feet with ${dice}d6 blunt damage.`,
                speaker: actorInfo.speaker
            });
        }
    });

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

    if (actorInfo.actor?.hasCondition(Condition.INANIMATE)) {
        ui.notifications.warn(`Token is inanimate, and immune to morale.`);
        return null;
    }

    const ini = actorInfo.actor.items.find((x) => x.name === 'Initiative');
    if (!ini) {
        ui.notifications.warn(`No Initiative skill for this actor for this action could be determined.`);
        return null;
    }

    let token = actorInfo.token;
    const unconscious = actorInfo.actor?.hasCondition(Condition.UNCONSCIOUS);
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
        target: ini.system.effectiveMasteryLevel + 5 * actorInfo.actor.system.encumbrance, // encumbrance do not count for morale
        type: 'Morale-d100'
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
                // CS - Empowered
                await token?.addCondition(Condition.EMPOWERED, {oneTurn: true});
            } else if (!result.isSuccess && !result.isCritical) {
                // MF - Cautious, turn ends
                await token?.addCondition(Condition.CAUTIOUS, {oneRound: true});
            } else if (!result.isSuccess && result.isCritical) {
                // CF
                const rollObj = new game.hm3.Roll('1d100');
                const roll = await rollObj.evaluate();
                if (roll.total <= 25) {
                    await token?.addCondition(Condition.BERSERK);
                } else if (roll.total <= 50) {
                    await token?.addCondition(Condition.DESPERATE);
                } else if (roll.total <= 75) {
                    await token?.addCondition(Condition.BROKEN);
                } else {
                    await token?.addCondition(Condition.CAUTIOUS);
                }
            }
            callOnHooks('hm3.onMoraleRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function steedCommandRoll(noDialog = false, myActor = null) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: null});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    if (!actorInfo.actor.system.mounted) {
        ui.notifications.warn(`Actor is not mounted.`);
        return null;
    }

    const riding = actorInfo.actor.items.find((item) => item.type === ItemType.SKILL && item.name.includes('Riding'));
    if (!riding) {
        ui.notifications.warn(`No Riding skill for this actor for this action could be determined.`);
        return null;
    }

    let token = actorInfo.token;

    const stdRollData = {
        actor: actorInfo.actor,
        fastforward: noDialog || !actorInfo.actor.hasPlayerOwner,
        label: `${actorInfo.actor.isToken ? actorInfo.actor.token.name : actorInfo.actor.name} Steed Command Check`,
        notes: '',
        notesData: {},
        private: !actorInfo.actor.hasPlayerOwner,
        speaker: actorInfo.speaker,
        target: riding.system.effectiveMasteryLevel,
        type: 'SteedCommand-d100'
    };

    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
        // token = actorInfo.actor.token;
    } else {
        stdRollData.actor = actorInfo.actor.id;
        // token = actorInfo.actor.prototypeToken;
        // stdRollData.token = token?.id;
    }

    const hooksOk = Hooks.call('hm3.preSteedCommandRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = await DiceHM3.d100StdRoll(stdRollData);
        if (result) {
            actorInfo.actor.runCustomMacro(result);
            if (result.isSuccess && result.isCritical) {
                // CS - +10 AML COMBAT 21
                await token?.addCondition(Condition.EMPOWERED, {oneTurn: true});
            } else if (!result.isSuccess && !result.isCritical) {
                // MF - -10 AML COMBAT 21
                await token?.addCondition(Condition.WEAKENED, {oneTurn: true});
            } else if (!result.isSuccess && result.isCritical) {
                // CF - Unhorsed (no roll) COMBAT 21
                unhorsingRoll(noDialog, myActor, true);
            }
            callOnHooks('hm3.onSteedCommandRoll', actorInfo.actor, result, stdRollData);
        }
        return result;
    }
    return null;
}

export async function unhorsingRoll(noDialog = false, myActor = null, autofail = false) {
    const actorInfo = getActor({actor: myActor, item: null, speaker: null});
    if (!actorInfo) {
        ui.notifications.warn(`No actor for this action could be determined.`);
        return null;
    }

    if (!actorInfo.actor.system.mounted) {
        ui.notifications.warn(`Actor is not mounted.`);
        return null;
    }

    const riding = actorInfo.actor.items.find((item) => item.type === ItemType.SKILL && item.name.includes('Riding'));
    if (!riding) {
        ui.notifications.warn(`No Riding skill for this actor for this action could be determined.`);
        return null;
    }

    let token = actorInfo.token;

    const stdRollData = {
        actor: actorInfo.actor,
        fastforward: noDialog,
        label: `${actorInfo.actor.isToken ? actorInfo.actor.token.name : actorInfo.actor.name} Unhorsing Roll`,
        modifier: actorInfo.actor.system.eph.unhorsing || 0,
        notes: '',
        notesData: {},
        private: !actorInfo.actor.hasPlayerOwner,
        speaker: actorInfo.speaker,
        target: riding.system.effectiveMasteryLevel,
        type: 'SteedCommand-d100'
    };

    if (actorInfo.actor.isToken) {
        stdRollData.token = actorInfo.actor.token.id;
        // token = actorInfo.actor.token;
    } else {
        stdRollData.actor = actorInfo.actor.id;
        // token = actorInfo.actor.prototypeToken;
        // stdRollData.token = token?.id;
    }

    const hooksOk = Hooks.call('hm3.preUnhorsingRoll', stdRollData, actorInfo.actor);
    if (hooksOk) {
        const result = !autofail ? await DiceHM3.d100StdRoll(stdRollData) : {isSuccess: false, isCritical: false};
        if (result) {
            actorInfo.actor.runCustomMacro(result);
            if (result.isSuccess) {
                // CS/MS - rider stays in saddle (COMBAT 24)
                await game.hm3.GmSays({text: `<b>${token.name}</b> stays in the saddle.`, source: 'Combat 24'});
                if (result.isCritical) {
                    // CS - rider gains TA (COMBAT 24)
                }
            } else {
                // CF/MF - rider is thrown (COMBAT 24)
                await game.hm3.GmSays({text: `<b>${token.name}</b> is thrown.`, source: 'Combat 24'});
            }
            callOnHooks('hm3.onUnhorsingRoll', actorInfo.actor, result, stdRollData);
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
        if (!isNaN(changeValue))
            updateData['system.fatigue'] = Math.max(actorInfo.actor.system.fatigue + changeValue, 0);
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
    myActor &&= myActor instanceof Actor ? myActor : fromUuidSync(myActor);
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
    myActor &&= myActor instanceof Actor ? myActor : fromUuidSync(myActor);
    const skill = await combat.getItem(skillName, 'skill', myActor);

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
        const updateData = {'system.improveFlag': 1};
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
        const result = await combat.meleeAttack(combatant.token, targetToken, {weaponItem: weapon, unarmed, noDialog});
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

export async function esotericAttack(itemName = null, noDialog = false, myToken = null, forceAllow = false) {
    const combatant = getTokenInCombat(myToken, forceAllow);
    if (!combatant) return null;

    const targetToken = getUserTargetedToken(combatant);
    if (!targetToken) return null;

    let esoteric = null;
    if (itemName) {
        esoteric = await combat.getItem(itemName, 'skill', combatant.actor);
    }

    const hooksOk = Hooks.call('hm3.preEsotericAttack', combatant, targetToken, esoteric);
    if (hooksOk) {
        const result = await combat.esotericAttack(combatant.token, targetToken, esoteric);
        Hooks.call('hm3.onEsotericAttack', result, combatant, targetToken, esoteric);
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
export async function meleeCounterstrikeResume(
    atkTokenId,
    defTokenId,
    atkWeaponName,
    atkEffAML,
    atkAim,
    atkAspect,
    atkImpactMod,
    isGrappleAtk,
    noDialog = false
) {
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
export async function dodgeResume(
    atkTokenId,
    defTokenId,
    type,
    weaponName,
    effAML,
    aim,
    aspect,
    impactMod,
    isGrappleAtk,
    noDialog = false
) {
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
        'hm3.preDodgeResume',
        atkToken,
        defToken,
        type,
        weaponName,
        effAML,
        aim,
        aspect,
        impactMod,
        isGrappleAtk
    );
    if (hooksOk) {
        const result = await combat.dodgeResume(
            atkToken,
            defToken,
            type,
            weaponName,
            effAML,
            aim,
            aspect,
            impactMod,
            isGrappleAtk
        );
        Hooks.call(
            'hm3.onDodgeResume',
            result,
            atkToken,
            defToken,
            type,
            weaponName,
            effAML,
            aim,
            aspect,
            impactMod,
            isGrappleAtk
        );
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
export async function blockResume(
    atkTokenId,
    defTokenId,
    type,
    weaponName,
    effAML,
    aim,
    aspect,
    impactMod,
    isGrappleAtk,
    noDialog = false
) {
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
        'hm3.preBlockResume',
        atkToken,
        defToken,
        type,
        weaponName,
        effAML,
        aim,
        aspect,
        impactMod,
        isGrappleAtk
    );
    if (hooksOk) {
        const result = await combat.blockResume(
            atkToken,
            defToken,
            type,
            weaponName,
            effAML,
            aim,
            aspect,
            impactMod,
            isGrappleAtk,
            noDialog
        );
        Hooks.call(
            'hm3.onBlockResume',
            result,
            atkToken,
            defToken,
            type,
            weaponName,
            effAML,
            aim,
            aspect,
            impactMod,
            isGrappleAtk
        );
        return result;
    }
    return null;
}

export async function esotericResume(atkTokenId, defTokenId, atkWeaponName, atkEffAML, noDialog = false) {
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

    const hooksOk = Hooks.call('hm3.preEsotericResume', atkToken, defToken, atkWeaponName, atkEffAML);
    if (hooksOk) {
        const result = await combat.esotericResume(atkToken, defToken, atkWeaponName, atkEffAML);
        Hooks.call('hm3.onEsotericResume', result, atkToken, defToken, atkWeaponName, atkEffAML);
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
export async function ignoreResume(
    atkTokenId,
    defTokenId,
    type,
    weaponName,
    effAML,
    aim,
    aspect,
    impactMod,
    isGrappleAtk,
    noDialog = false
) {
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
        'hm3.preIgnoreResume',
        atkToken,
        defToken,
        type,
        weaponName,
        effAML,
        aim,
        aspect,
        impactMod,
        isGrappleAtk
    );
    if (hooksOk) {
        const result = await combat.ignoreResume(
            atkToken,
            defToken,
            type,
            weaponName,
            effAML,
            aim,
            aspect,
            impactMod,
            isGrappleAtk
        );
        Hooks.call(
            'hm3.onIgnoreResume',
            result,
            atkToken,
            defToken,
            type,
            weaponName,
            effAML,
            aim,
            aspect,
            impactMod,
            isGrappleAtk
        );
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
 * @param {TokenHM3} token
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

        utility.executeMacroScript(foundMacro, {
            actor: actor,
            token: token,
            rollResult: rollResult,
            rollData: rollData,
            item: item
        });
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
    const source = canvas.tokens.get(sourceTokenId);
    const target = canvas.tokens.get(targetTokenId);

    if (!source || !target || !canvas.scene || !canvas.scene.grid) return 9999;

    const sourceElevation = source.document?.elevation || 0;
    const targetElevation = target.document?.elevation || 0;

    let distance = utility.truncate(canvas.grid.measurePath([source.center, target.center]).distance, 0);
    distance = Math.sqrt(distance ** 2 + (sourceElevation - targetElevation) ** 2);
    distance = Math.ceil(distance / canvas.dimensions.distance) * canvas.dimensions.distance;

    if (gridUnits) return distance / canvas.dimensions.distance;

    return distance;
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
 * @param {ActorHM3|TokenHM3|TokenDocumentHM3} actorOrToken
 * @param {string} aeName
 * @returns
 */
export function hasActiveEffect(actorOrToken, aeName, strict = false) {
    const ae = getActiveEffect(actorOrToken, aeName, strict);
    return !!ae && !!ae?.active;
}

/**
 * TODO
 * @param {ActorHM3|TokenHM3|TokenDocumentHM3} actorOrToken
 * @param {string} aeName
 * @returns
 */
export function getActiveEffect(actorOrToken, aeName, strict = false) {
    let actor = actorOrToken instanceof ActorHM3 ? actorOrToken : null;
    if (!actor) {
        actor =
            actorOrToken instanceof TokenHM3 || actorOrToken instanceof TokenDocumentHM3 ? actorOrToken.actor : null;
    }

    if (actor && aeName) {
        return strict
            ? actor.allApplicableEffects(true).find((ae) => ae.name === aeName)
            : actor
                  .allApplicableEffects(true)
                  .find(
                      (ae) =>
                          ae.name.toLowerCase().includes(aeName.toLowerCase()) ||
                          aeName.toLowerCase().includes(ae.name.toLowerCase())
                  );
    } else return null;
}

let createMutex = new Mutex();

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
    return createMutex.runExclusive(async () => {
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
            if (game.user.isGM) ui.notifications.info(`HM3 | Effect ${effectData.label} is unique and already exists.`);
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

        if (options.hidden) await effect.setFlag('hm3', 'hidden', true);
        if (options.unique) await effect.setFlag('hm3', 'unique', true);

        if (options.selfDestroy) {
            await effect.setFlag('hm3', 'selfDestroy', true);
            await effect.setFlag(
                'effectmacro',
                'onDisable.script',
                `game.hm3.macros.deleteActiveEffect('${effectData.token.id}', '${effect.id}');`
            );
        }

        return effect;
    });
}

let deleteMutex = new Mutex();
/**
 * Deletes an active effect from the token.
 * @param {string} tokenId - The id of the token
 * @param {string} effectId - The id of the active effect
 * @returns {Promise<void>}
 */
export async function deleteActiveEffect(tokenId, effectId) {
    if (!tokenId || !effectId || !canvas.tokens.get(tokenId)) return;
    // sometimes effect macros fire twice -> race condition
    await deleteMutex.runExclusive(async () => {
        const token = canvas.tokens.get(tokenId);
        const effect = token?.actor?.allApplicableEffects().find((e) => e.id === effectId);
        return effect?.delete();
    });
}

/**
 * Creates a condition on the token.
 * @param {TokenHM3} token - The token to apply the condition to
 * @param {string} condition - The condition to apply
 * @param {Object} [conditionOptions={}] - Options for the condition
 * @param {number} [conditionOptions.numTurns=0] - Number of turns defaults to 0
 * @param {boolean} [conditionOptions.oneRoll=false] - Only one roll defaults to false
 * @param {boolean} [conditionOptions.oneRound=false] - Only one round defaults to false
 * @param {boolean} [conditionOptions.oneTurn=false] - Only one turn defaults to false
 * @param {number} [conditionOptions.outnumbered=1] - Outnumbered defaults to 1
 * @returns {Promise<HarnMasterActiveEffect>}
 */
export async function createCondition(token, condition, conditionOptions = {}) {
    if (!token) return null;

    conditionOptions = foundry.utils.mergeObject(
        {
            numTurns: 0,
            oneRoll: false,
            oneRound: false,
            oneTurn: false,
            outnumbered: 1,
            overlay: false
        },
        conditionOptions
    );

    let cond, condData;
    switch (condition) {
        case Condition.BLINDED:
        case Condition.DEAFENED:
        case Condition.INCAPACITATED:
            if (game.user.isGM) ui.notifications.info(`Condition '${condition}' not yet implemented.`);
            return null;

        // This is a special state of battle frenzy. Any character who enters this mode must take the most
        // aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike.
        // Further Initiative rolls are ignored until the battle ends. (COMBAT 16)
        case Condition.BERSERK:
            condData = await berserk.createCondition(token, conditionOptions);
            break;

        // The character is unable to fight in any useful way. The only available options are flight or
        // surrender. Flight is normally preferable; surrender is a last resort. If neither is feasible,
        // the character makes a Rest or Pass action option, but can defend if attacked except that
        // Counterstrike is prohibited. (COMBAT 16)
        case Condition.BROKEN:
            condData = await broken.createCondition(token, conditionOptions);
            break;

        // A cautious character will not Engage, must choose Pass if engaged, and cannot select the
        // Counterstrike defense. (COMBAT 16)
        case Condition.CAUTIOUS:
            condData = await cautious.createCondition(token, conditionOptions);
            break;

        case Condition.CLOSE_MODE:
            condData = await closemode.createCondition(token, conditionOptions);
            break;

        // Character tries to conclude the battle, one way or the other, as soon as possible. Until
        // the situation changes and a new Initiative Test is passed, the character selects the most
        // aggressive option available. (COMBAT 16)
        case Condition.DESPERATE:
            condData = await desperate.createCondition(token, conditionOptions);
            break;

        case Condition.DISTRACTED:
            condData = await distracted.createCondition(token, conditionOptions);
            break;

        case Condition.DYING:
            condData = await dying.createCondition(token, conditionOptions);
            break;

        // Character selects and executes any Action Option, with a +10 bonus to EML. If the character’s
        // current morale state is non-normal, it returns to normal. (COMBAT 16)
        case Condition.EMPOWERED:
            condData = await empowered.createCondition(token, conditionOptions);
            break;

        case Condition.GRAPPLED:
            condData = await grappled.createCondition(token, conditionOptions);
            break;

        case Condition.INANIMATE:
            condData = await inanimate.createCondition(token, conditionOptions);
            break;

        case Condition.NO_FUMBLE:
            condData = await nofumble.createCondition(token, conditionOptions);
            break;

        case Condition.NO_OUTNUMBERED:
            condData = await nooutnumbered.createCondition(token, conditionOptions);
            break;

        case Condition.NO_STUMBLE:
            condData = await nostumble.createCondition(token, conditionOptions);
            break;

        // A character is outnumbered if exclusively engaged by two or more opponents. When counting
        // opponents for this purpose, prone enemies are excluded, as are enemies who are themselves
        // engaged by other friendly characters. (COMBAT 11)
        case Condition.OUTNUMBERED:
            condData = await outnumbered.createCondition(token, conditionOptions);
            break;

        case Condition.PRONE:
            condData = await prone.createCondition(token, conditionOptions);
            break;

        case Condition.SECONDARY_HAND:
            condData = await secondaryhand.createCondition(token, conditionOptions);
            break;

        case Condition.SHOCKED:
            condData = await shocked.createCondition(token, conditionOptions);
            break;

        case Condition.UNCONSCIOUS:
            condData = await unconscious.createCondition(token, conditionOptions);
            break;

        // Character selects and executes any Action Option, with a +10 bonus to EML. If the character’s
        // current morale state is non-normal, it returns to normal. (COMBAT 16)
        case Condition.WEAKENED:
            condData = await weakened.createCondition(token, conditionOptions);
            break;

        default:
            if (game.user.isGM) ui.notifications.error(`${condition} is no valid condition.`);
            return null;
    }

    if (!condData) {
        if (game.user.isGM) ui.notifications.error(`Condition ${condition} could not be created.`);
        return null;
    }

    if (condData.options.unique && token.hasCondition(condition)) {
        if (game.user.isGM) ui.notifications.info(`HM3 | Condition ${condition} is unique and already exists.`);
        return null;
    }

    if (condData.options.overlay) {
        condData.effectData.flags.core = {overlay: true};
    }

    Object.keys(condData.effectData.flags?.effectmacro || {}).forEach((v) => {
        const condMacro = condData.effectData.flags.effectmacro[v];
        condMacro.script =
            'let success=true;try{' +
            condMacro.script.trim() +
            `}catch(error){success=false;game.hm3.gmconsole('error','Error in Condition "${condition}" - Effect Macro "${v}"',error);} 
            finally{Hooks.callAllUsers('hm3.${condData.effectData.flags.hm3.uuid}', success);}`;
        condMacro.script = utility.beautify(condMacro.script);
    });

    condData.effectData.system = {status: 'Running'};

    const onCreateScript = condData.effectData.flags?.effectmacro?.onCreate?.script;
    if (!onCreateScript || onCreateScript?.length === 0) {
        return createActiveEffect(condData.effectData, condData.changes, condData.options);
    } else {
        const uuid = condData.effectData.flags.hm3.uuid;
        const callbackPromise = new Promise((resolve, reject) => {
            let timer;
            Hooks.once(`hm3.${uuid}`, (success) => {
                if (timer) clearTimeout(timer);
                resolve(success);
            });
            timer = setTimeout(
                () => reject({error: `HM3 | Timeout in 'onCreate' callback for Condition ${condition}!`, condData}),
                5000
            );
        });

        const res = await Promise.allSettled([
            callbackPromise,
            createActiveEffect(condData.effectData, condData.changes, condData.options)
        ]);

        return res[1].value;
    }
}

export async function deleteCondition(token, condition) {
    if (!token || !condition || !condition?.id) return null;

    if (!condition.hasDeleteMacro()) {
        return deleteActiveEffect(token.id, condition.id);
    } else {
        const uuid = condition.flags.hm3.uuid;
        const callbackPromise = new Promise((resolve, reject) => {
            let timer;
            Hooks.once(`hm3.${uuid}`, (success) => {
                if (timer) clearTimeout(timer);
                resolve(success);
            });
            timer = setTimeout(
                () =>
                    reject({error: `HM3 | Timeout in 'onDelete' callback for Condition ${condition.name}!`, condition}),
                5000
            );
        });

        let ret = null;
        try {
            ret = await Promise.allSettled([callbackPromise, deleteActiveEffect(token.id, condition.id)]);
        } catch (error) {
            console.error(error);
        } finally {
            return ret[1].value;
        }
    }
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
 * @param {TokenHM3} [injuryData.token]
 * @param {Object} [options={}]
 * @returns {Promise<ItemHM3>}
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
            subType: InjuryType.HEALING, // bloodloss, disease, healing, infection, poison, shock, toxin (different healing rolls)
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
 * @param {TokenHM3} token
 * @param {string} injuryId
 * @param {string} injuryName
 * @returns
 */
export async function createInjuryHelper(injuryData) {
    const timestamp = SimpleCalendar.api.timestamp();

    let startTime, scDate;
    switch (injuryData.subType) {
        case InjuryType.BLOODLOSS: // HR: always H6
        case InjuryType.HEALING: // HR: varies, plus half Physician EML
            startTime = SimpleCalendar.api.timestampPlusInterval(timestamp, {day: 5});
            scDate = SimpleCalendar.api.timestampToDate(startTime);
            break;

        case InjuryType.DISEASE: // HR: varies
        case InjuryType.INFECTION: // HR: varies (same as wound), plus Physician SI
            startTime = SimpleCalendar.api.timestampPlusInterval(timestamp, {day: 1});
            scDate = SimpleCalendar.api.timestampToDate(startTime);
            break;

        case InjuryType.POISON: // HR: varies
        case InjuryType.TOXIN: // HR: varies
            const minute = injuryData.minute || 5;
            const second = injuryData.second || 0;
            startTime = SimpleCalendar.api.timestampPlusInterval(timestamp, {minute, second});
            break;

        case InjuryType.SHOCK: // HR: always H5, plus half Physician EML
            startTime = SimpleCalendar.api.timestampPlusInterval(timestamp, {hour: 4});
            break;

        default:
            console.error('HM3 | Wrong injury subType.');
            break;
    }

    // Make the healing rolls at midnight (besides poison & shock rolls)
    if (scDate) {
        startTime = SimpleCalendar.api.dateToTimestamp({
            year: scDate.year,
            month: scDate.month,
            day: scDate.day,
            hour: 0,
            minute: 0,
            seconds: 0
        });
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

/**
 * Checks if the token can perform a TA (Tactical Advantage) of the given type.
 * @param {TokenHM3} token - The token to check
 * @returns {boolean} - True if the TA is possible, false otherwise
 */
export async function isTAPossible(token) {
    if (!token) return true;

    const cautious = token.hasCondition(Condition.CAUTIOUS);
    const distracted = token.hasCondition(Condition.DISTRACTED);
    const unconscious = token.hasCondition(Condition.UNCONSCIOUS);

    return !cautious && !distracted && !unconscious && (await game.hm3.socket.executeAsGM('isFirstTA'));
}

export async function updateOverlay(token) {
    let condition = null;

    if (token.hasCondition(Condition.DYING)) {
        condition = token.getCondition(Condition.DYING);
        if (condition.testUserPermission(game.user, 'OWNER')) await condition.setFlag('core', 'overlay', true);
    } else if (token.hasCondition(Condition.UNCONSCIOUS)) {
        condition = token.getCondition(Condition.UNCONSCIOUS);
        if (condition.testUserPermission(game.user, 'OWNER')) await condition.setFlag('core', 'overlay', true);
    } else if (token.hasCondition(Condition.SHOCKED)) {
        condition = token.getCondition(Condition.SHOCKED);
        if (condition.testUserPermission(game.user, 'OWNER')) await condition.setFlag('core', 'overlay', true);
    } else if (token.hasCondition(Condition.PRONE)) {
        condition = token.getCondition(Condition.PRONE);
        if (condition.testUserPermission(game.user, 'OWNER')) await condition.setFlag('core', 'overlay', true);
    }

    return condition;
}
