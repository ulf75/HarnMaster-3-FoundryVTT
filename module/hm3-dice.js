import {HM3} from './config.js';
import {Aspect, Condition, InjuryType, ItemType} from './hm3-types.js';
import * as utility from './utility.js';

export class DiceHM3 {
    /*--------------------------------------------------------------------------------*/
    /*        STANDARD D100 ROLL PROCESSING
    /*--------------------------------------------------------------------------------*/

    /**
     * Performs a standard d100 "skill" roll, optionally presenting a dialog
     * to collect a modifier (although can be used for any straignt d100 roll
     * that takes an optional modifier and rolls against a target value).
     *
     * Note that the modifier affects the target value, not the die roll.
     * The die roll is always a strait "1d100" roll without modifiers.
     *
     * rollData is expected to contain the following values:
     *  target: Target value to check against
     *  modifier: Modifier to target value
     *  label: The label associated with the 'target' value
     *  fastForward: If true, assume no modifier and don't present Dialog
     *  speaker: the Speaker to use in Chat
     *  rollMode: the rollMode to use
     *  actorData: actor data
     *
     * @param {Object} rollData
     */
    static async d100StdRoll(rollData) {
        const speaker = rollData.speaker || ChatMessage.getSpeaker();

        const dialogOptions = {
            effSkillBase: rollData.effSkillBase,
            fluff: rollData.fluff || null,
            isAbility: rollData.isAbility || false,
            isCraftOrLore: rollData.isCraftOrLore || false,
            isTreatment: rollData.type === 'treatment' || false,
            label: rollData.label,
            modifier: rollData.modifier || 0,
            name: speaker.alias,
            physicianSkills: rollData.physicianSkills || [],
            skill: rollData.skill,
            subType: rollData.subType || InjuryType.HEALING,
            target: rollData.target,
            treatmentTable: rollData.treatmentTable,
            type: rollData.type
        };

        // Create the Roll instance
        let roll;
        if (rollData.fastforward)
            roll = await DiceHM3.rollTest({
                diceNum: 1,
                diceSides: 100,
                modifier: rollData.modifier || 0,
                target: rollData.target,
                type: rollData.type
            });
        else if (rollData.skill?.includes('Climbing')) roll = await DiceHM3.d100ClimbingDialog(dialogOptions);
        else if (rollData.skill?.includes('Jumping')) roll = await DiceHM3.d100JumpingDialog(dialogOptions);
        else roll = await DiceHM3.d100StdDialog(dialogOptions);

        // If user cancelled the roll, then return immediately
        if (!roll) return null;

        const addlInfo = rollData.addlInfoCallback
            ? rollData.addlInfoCallback(roll)
            : roll.preData.addlInfoCallback
            ? roll.preData.addlInfoCallback(roll)
            : undefined;

        // Prepare for Chat Message
        const chatTemplate = 'systems/hm3/templates/chat/standard-test-card.hbs';

        const notesData = foundry.utils.mergeObject(rollData.notesData, {
            actor: speaker.alias,
            isCF: !roll.isSuccess && roll.isCritical,
            isCritical: roll.isCritical,
            isCS: roll.isSuccess && roll.isCritical,
            isMF: !roll.isSuccess && !roll.isCritical,
            isMS: roll.isSuccess && !roll.isCritical,
            isSubstantial: roll.isSubstantial,
            isSuccess: roll.isSuccess,
            modifier: rollData.modifier,
            roll: roll.rollObj.total,
            rollText: roll.description,
            target: rollData.target || roll.target - roll.modifier
        });
        let renderedNotes = rollData.notes ? utility.stringReplacer(rollData.notes, notesData) : '';

        const multiplier = roll.preData.multiplier || rollData.multiplier || 5;
        let title = rollData.label;
        if (rollData.isAbility)
            title = rollData.label.replace(`${rollData.skill} Roll`, `${rollData.skill} x${multiplier} Roll`);
        if (roll.preData.isAppraisal) title = rollData.label.replace('Skill Test', 'Appraisal Test');
        let fluffResult = null;
        if (rollData.fluffResult) {
            if (roll.isCritical) fluffResult = roll.isSuccess ? rollData.fluffResult.CS : rollData.fluffResult.CF;
            else fluffResult = roll.isSuccess ? rollData.fluffResult.MS : rollData.fluffResult.MF;
        }

        const chatTemplateData = {
            addlInfo,
            description: roll.description,
            falling: dialogOptions.falling,
            fluff: rollData.fluff
                ? rollData.fluff.startsWith('<p>')
                    ? rollData.fluff
                    : '<p>' + rollData.fluff + '</p>'
                : undefined,
            fluffResult: fluffResult
                ? fluffResult.startsWith('<p>')
                    ? fluffResult
                    : '<p>' + fluffResult + '</p>'
                : undefined,
            isCritical: roll.isCritical,
            isSubstantial: roll.isSubstantial,
            isSuccess: roll.isSuccess,
            modifiedTarget: roll.target,
            modifier: Math.abs(roll.modifier),
            name: rollData.name || '',
            notes: renderedNotes,
            origTarget: rollData.target || roll.target - roll.modifier,
            plusMinus: roll.modifier < 0 ? '-' : '+',
            roll,
            rollResult: roll.rollObj.total,
            rollValue: roll.rollObj.total,
            showResult: false,
            title,
            tokenId: speaker.token,
            type: roll.type,
            visibleActorId: speaker.actor
        };

        const html = await renderTemplate(chatTemplate, chatTemplateData);

        const rollMode = this.getRollMode({
            blind: rollData.blind,
            isAppraisal: roll.preData.isAppraisal,
            private: rollData.private,
            skill: rollData.skill
        });
        const messageData = {
            content: html.trim(),
            roll: roll.rollObj,
            sound: CONFIG.sounds.dice,
            speaker,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            user: game.user.id
        };

        const messageOptions = {rollMode};

        // Create a chat message
        await roll.rollObj.toMessage(messageData, messageOptions);

        return chatTemplateData;
    }

    static async d100ClimbingDialog(dialogOptions) {
        // Render modal dialog
        let dlgTemplate = 'systems/hm3/templates/dialog/climbing-test-dialog.hbs';
        let dialogData = {
            effSkillBase: dialogOptions.effSkillBase,
            modifier: dialogOptions.modifier,
            target: dialogOptions.target
        };

        dialogData.difficulty = 'Easy';
        dialogData.difficulties = [{key: 'Easy'}, {key: 'Hard'}, {key: 'Very Hard'}];

        dialogData.gear = '0';
        dialogData.gears = [
            {key: '0', label: 'No climbing gear (+0 EML)'},
            {key: '10', label: 'Ordinary climbing gear (+10 EML)'},
            {key: '20', label: 'Good climbing gear (+20 EML)'}
        ];

        const html = await renderTemplate(dlgTemplate, dialogData);

        // Create the dialog window
        return Dialog.prompt({
            content: html.trim(),
            label: 'Roll',
            options: {width: 470},
            title: dialogOptions.label,
            callback: (html) => {
                const form = html[0].querySelector('form');
                const formModifier = form.modifier.value;
                const formDifficulty = form.difficulties.value;
                const formGear = form.gears.value;

                let target = dialogOptions.target;
                return DiceHM3.rollTest({
                    addlInfoCallback: (result) => {
                        const progress = `Vertical progress (${formDifficulty}):`;
                        const CS = {'Easy': 30, 'Hard': 20, 'Very Hard': 10};
                        const MS = {'Easy': 15, 'Hard': 10, 'Very Hard': 5};
                        const MF = {'Easy': 0, 'Hard': -5, 'Very Hard': -10};

                        if (result.isSuccess) {
                            if (result.isCritical) return `<p>${progress} +${CS[formDifficulty]} ft</p>`;
                            else {
                                const d = utility.truncate(
                                    result.isSubstantial ? MS[formDifficulty] * 1.25 : MS[formDifficulty],
                                    0
                                );
                                return `<p>${progress} +${d} ft</p>`;
                            }
                        } else {
                            if (!result.isCritical) {
                                const d = utility.truncate(
                                    result.isSubstantial ? MF[formDifficulty] * 1.25 : MF[formDifficulty],
                                    0
                                );
                                return `<p>${progress} ${d} ft</p><p>Negative progress indicates the character has encountered an obstacle and been forced to backtrack.</p>`;
                            } else {
                                dialogOptions.falling = true;
                                return `${dialogOptions.name} loses grip and falls.`;
                            }
                        }
                    },
                    data: null,
                    diceNum: 1,
                    diceSides: 100,
                    modifier: Number(formModifier) + Number(formGear),
                    name: dialogOptions.name,
                    target,
                    type: dialogOptions.type
                });
            }
        });
    }

    static async d100JumpingDialog(dialogOptions) {
        // Render modal dialog
        let dlgTemplate = 'systems/hm3/templates/dialog/jumping-test-dialog.hbs';
        let dialogData = {
            effSkillBase: dialogOptions.effSkillBase,
            modifier: dialogOptions.modifier,
            target: dialogOptions.target
        };

        dialogData.jump = 'Long';
        dialogData.jumps = [{key: 'Long'}, {key: 'High'}];

        dialogData.start = '1';
        dialogData.starts = [
            {key: '1', label: 'Running start'},
            {key: '2', label: 'Standing jump'}
        ];

        const html = await renderTemplate(dlgTemplate, dialogData);

        // Create the dialog window
        return Dialog.prompt({
            content: html.trim(),
            label: 'Roll',
            title: dialogOptions.label,
            callback: (html) => {
                const form = html[0].querySelector('form');
                const formModifier = form.modifier.value;
                const formJump = form.jumps.value;
                const formStart = form.starts.value;
                const formLabel = dialogData.starts[form.starts.selectedIndex].label;
                const start = Number(formStart);
                const height = 5 / start; // [ft]

                let target = dialogOptions.target;
                return DiceHM3.rollTest({
                    addlInfoCallback: (result) => {
                        const jump = `${formJump} jump (${formLabel}):`;
                        const CS = {'High': 1, 'Long': 3};
                        const MS = {'High': 0.75, 'Long': 2};
                        const MF = {'High': 0.5, 'Long': 1};

                        if (result.isSuccess) {
                            if (result.isCritical) {
                                const d = utility.truncate(height * CS[formJump], 0);
                                return `<p>${jump} ${d} ft</p>`;
                            } else {
                                const d = utility.truncate(
                                    height * (result.isSubstantial ? MS[formJump] * 1.25 : MS[formJump]),
                                    0
                                );
                                return `<p>${jump} ${d} ft</p>`;
                            }
                        } else {
                            if (!result.isCritical) {
                                const d = utility.truncate(
                                    height * (result.isSubstantial ? MF[formJump] * 0.75 : MF[formJump]),
                                    0
                                );
                                return `<p>${jump} ${d} ft</p>`;
                            } else return `${dialogOptions.name} stumbles.`;
                        }
                    },
                    data: null,
                    diceNum: 1,
                    diceSides: 100,
                    modifier: Number(formModifier),
                    name: dialogOptions.name,
                    target,
                    type: dialogOptions.type
                });
            }
        });
    }

    /**
     * Renders a dialog to get the modifier for a d100 skill roll, and then
     * perform a d100 dice roll to determine results.  Returns Roll object
     * representing outcome of die roll, or null if user cancelled dialog.
     *
     * @param {*} dialogOptions
     */
    static async d100StdDialog(dialogOptions) {
        // Render modal dialog
        let dlgTemplate = dialogOptions.template || 'systems/hm3/templates/dialog/standard-test-dialog.hbs';
        let dialogData = {
            effSkillBase: dialogOptions.effSkillBase,
            fluff: dialogOptions.fluff || null,
            isAbility: dialogOptions.isAbility || false,
            isCraftOrLore: dialogOptions.isCraftOrLore || false,
            isTreatment: dialogOptions.isTreatment || false,
            isMorale: dialogOptions.type === 'Morale-d100',
            modifier: dialogOptions.modifier,
            target: dialogOptions.target
        };

        if (dialogData.isAbility) {
            dialogData.multiplier = 5;
            dialogData.multipliers = [
                {key: 1, label: `${dialogOptions.skill} x1 (EML ${dialogOptions.effSkillBase * 1})`},
                {key: 2, label: `${dialogOptions.skill} x2 (EML ${dialogOptions.effSkillBase * 2})`},
                {key: 3, label: `${dialogOptions.skill} x3 (EML ${dialogOptions.effSkillBase * 3})`},
                {key: 4, label: `${dialogOptions.skill} x4 (EML ${dialogOptions.effSkillBase * 4})`},
                {key: 5, label: `${dialogOptions.skill} x5 (EML ${dialogOptions.effSkillBase * 5})`},
                {key: 6, label: `${dialogOptions.skill} x6 (EML ${dialogOptions.effSkillBase * 6})`},
                {key: 7, label: `${dialogOptions.skill} x7 (EML ${dialogOptions.effSkillBase * 7})`}
            ];
        }

        if (dialogData.isMorale) {
            dialogData.moraleModification = 0;
            dialogData.moraleModifications = [
                {key: -20, label: `Desperate Situation (EML -20)`},
                {key: -10, label: `Bad Situation (EML -10)`},
                {key: 0, label: `Normal Situation (EML +0)`},
                {key: 10, label: `Good Situation (EML +10)`},
                {key: 20, label: `Excellent Situation (EML +20)`}
            ];
        }

        const isHealingRoll = dialogOptions.type === InjuryType.HEALING;
        if (isHealingRoll) {
            if (dialogOptions.subType === InjuryType.HEALING || dialogOptions.subType === InjuryType.SHOCK) {
                dialogData.isPhysician = true;
                dialogData.physicianSkills = dialogOptions.physicianSkills.map((p) => {
                    return {
                        key: Math.round(p.system.effectiveMasteryLevel / 2),
                        label: `${p.actor.name} (EML/2 ${Math.round(p.system.effectiveMasteryLevel / 2)})`
                    };
                });
                dialogData.physicianSkills.push({key: 0, label: '3rd Party Physician skill'});
                dialogData.physicianEml = dialogData.physicianSkills[0].key;
                dialogData.physicianMod = 'EML/2';
            } else if (dialogOptions.subType === InjuryType.INFECTION) {
                dialogData.isPhysician = true;
                dialogData.physicianSkills = dialogOptions.physicianSkills.map((p) => {
                    return {
                        key: Math.floor(p.system.masteryLevel / 10),
                        label: `${p.actor.name} (SI ${Math.floor(p.system.masteryLevel / 10)})`
                    };
                });
                dialogData.physicianSkills.push({key: 0, label: '3rd Party Physician skill'});
                dialogData.physicianEml = dialogData.physicianSkills[0].key;
                dialogData.physicianMod = 'SI';
            }
        }

        if (dialogData.isTreatment) {
            dialogData.treatmentModifier = dialogOptions.treatmentTable.eml;
            dialogData.physicianSkills = dialogOptions.physicianSkills.map((p) => {
                return {
                    key: p.system.effectiveMasteryLevel,
                    label: `${p.actor.name} (EML ${p.system.effectiveMasteryLevel})`
                };
            });
            dialogData.physicianSkills.push(
                {key: 0, label: '3rd Party Physician skill'},
                {key: -1, label: 'No Treatment'}
            );
            dialogData.physicianEml = dialogData.physicianSkills[0].key;
        }

        const html = await renderTemplate(dlgTemplate, dialogData);

        // Create the dialog window
        return Dialog.prompt({
            title: dialogOptions.label,
            content: html.trim(),
            label: 'Roll',
            callback: (html) => {
                const form = html[0].querySelector('form');
                const formModifier = form.modifier.value;
                const formPhysicianEml = form.physicianEml?.value || '0';
                const formTarget = form.target.value;
                const formTreatmentModifier = form.treatmentModifier?.value || '0';
                const isAppraisal = form.appraisal?.checked || false;
                const moraleModification = form.moraleModifications?.value || '0';
                const multiplier = form.multipliers?.selectedIndex + 1 || -1;

                let target = !isNaN(Number(formTarget)) ? Number(formTarget) : dialogOptions.target;
                if (dialogOptions.isAbility) target = dialogOptions.effSkillBase * multiplier;
                if (isAppraisal)
                    target = Math.max(
                        dialogOptions.target + dialogOptions.effSkillBase,
                        5 * dialogOptions.effSkillBase
                    );
                if (dialogOptions.isTreatment)
                    target = !isNaN(Number(formPhysicianEml)) ? Number(formPhysicianEml) : dialogOptions.target;
                const phyBonus =
                    !isNaN(Number(formPhysicianEml)) && dialogData.isPhysician ? Number(formPhysicianEml) : 0;

                return DiceHM3.rollTest({
                    data: null,
                    diceNum: 1,
                    diceSides: 100,
                    isAbility: dialogOptions.isAbility,
                    isAppraisal,
                    isTreatment: dialogOptions.isTreatment,
                    modifier:
                        Number(formModifier) + Number(formTreatmentModifier) + Number(moraleModification) + phyBonus,
                    multiplier,
                    name: dialogOptions.name,
                    noTreatment: target === -1,
                    target,
                    type: dialogOptions.type
                });
            }
        });
    }

    /*--------------------------------------------------------------------------------*/
    /*        STANDARD D6 ROLL PROCESSING
    /*--------------------------------------------------------------------------------*/

    /**
     * Performs a standard d6 roll, optionally presenting a dialog
     * to collect a modifier (although can be used for any straignt d6 roll
     * that takes an optional modifier and rolls against a target value).
     *
     * Note that the modifier affects the target value, not the die roll.
     * The die roll is always a strait "1d100" roll without modifiers.
     *
     * rollData is expected to contain the following values:
     *  target: Target value to check against
     *  modifier: Modifier to target value
     *  numdice: Number of d6 to roll
     *  label: The label associated with the 'target' value
     *  fastForward: If true, assume no modifier and don't present Dialog
     *  speaker: the Speaker to use in Chat
     *  rollMode: the rollMode to use
     *  actorData: actor data
     *
     * @param {Object} rollData
     */
    static async d6Roll(rollData) {
        const speaker = rollData.speaker || ChatMessage.getSpeaker();
        const rollMode = this.getRollMode({skill: rollData.skill});

        const dialogOptions = {
            items: rollData.items,
            label: rollData.label,
            modifier: rollData.modifier || 0,
            numdice: Number(rollData.numdice),
            target: Number(rollData.target),
            type: rollData.type
        };

        // Create the Roll instance
        const roll = rollData.fastforward
            ? await DiceHM3.rollTest({
                  diceNum: Number(rollData.numdice),
                  diceSides: 6,
                  modifier: rollData.modifier || 0,
                  target: rollData.target,
                  type: rollData.type
              })
            : await DiceHM3.d6Dialog(dialogOptions);

        // If user cancelled the roll, then return immediately
        if (!roll) return null;

        // Prepare for Chat Message
        const chatTemplate = 'systems/hm3/templates/chat/standard-test-card.hbs';

        const notesData = foundry.utils.mergeObject(rollData.notesData, {
            actor: speaker.alias,
            isSuccess: roll.isSuccess,
            roll: roll.rollObj.total,
            rollText: roll.description,
            target: rollData.target
        });
        const renderedNotes = rollData.notes ? utility.stringReplacer(rollData.notes, notesData) : '';

        const isTAPossible =
            !rollData.noTA &&
            ['fumble', 'kill', 'shock', 'stumble'].includes(rollData.type) &&
            (await game.hm3.macros.isTAPossible(canvas.tokens.get(rollData.token)));
        const addlInfo = !roll.isSuccess && isTAPossible ? '<p>Opponent gains a Tactical Advantage.</p>' : '';

        const chatTemplateData = {
            addlInfo,
            atkTokenId: rollData.opponentToken?.id,
            description: roll.description,
            isSuccess: roll.isSuccess,
            modifiedTarget: roll.target,
            modifier: Math.abs(roll.modifier),
            notes: renderedNotes,
            origTarget: rollData.target,
            ota: !roll.isSuccess && isTAPossible, // Opponent TA
            plusMinus: roll.modifier < 0 ? '-' : '+',
            roll: roll,
            rollResult: roll.rollObj.dice[0].values.join(' + '),
            rollValue: roll.rollObj.total,
            showResult: roll.rollObj.dice[0].values.length > 1,
            title: rollData.label,
            type: rollData.type,
            visibleActorId: rollData.opponentToken?.actor?.id
        };

        const html = await renderTemplate(chatTemplate, chatTemplateData);

        const messageData = {
            content: html.trim(),
            roll: roll.rollObj,
            sound: CONFIG.sounds.dice,
            speaker,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            user: game.user.id
        };

        const messageOptions = {rollMode};

        // Create a chat message
        await roll.rollObj.toMessage(messageData, messageOptions);
        // await ChatMessage.create(messageData, messageOptions);

        return chatTemplateData;
    }

    /**
     * Renders a dialog to get the modifier for a d6 roll, and then
     * perform a d6 dice roll to determine results.  Returns Roll object
     * representing outcome of die roll, or null if user cancelled dialog.
     *
     * @param {*} dialogOptions
     */
    static async d6Dialog(dialogOptions) {
        // Render modal dialog
        let dlgTemplate = dialogOptions.template || 'systems/hm3/templates/dialog/standard-test-dialog.hbs';
        let dialogData = {
            target: dialogOptions.target,
            modifier: dialogOptions.modifier
        };
        const html = await renderTemplate(dlgTemplate, dialogData);

        // Create the dialog window
        return Dialog.prompt({
            title: dialogOptions.label,
            content: html.trim(),
            label: 'Roll',
            callback: (html) => {
                const formModifier = html[0].querySelector('form').modifier.value;
                return DiceHM3.rollTest({
                    type: dialogOptions.type,
                    target: dialogOptions.target,
                    data: null,
                    diceSides: 6,
                    diceNum: dialogOptions.numdice,
                    modifier: formModifier
                });
            }
        });
    }

    /*--------------------------------------------------------------------------------*/
    /*        SKILL DEVELOPMENT ROLL PROCESSING
    /*--------------------------------------------------------------------------------*/

    static async sdrRoll(item, showChatMsg = true) {
        const speaker = ChatMessage.getSpeaker({actor: item.actor});

        let roll = await game.hm3.macros.rollObjectEvaluatedAsync(`1d100 + ${item.system.skillBase.value}`, {
            name: item.actor.name,
            type: 'sdrRoll'
        });

        const isSuccess = roll.total > item.system.masteryLevel;

        const re = RegExp('(([^)]+))');
        const specMatch = item.name.match(/\(([^\)]+)\)/);
        const chatTemplate = 'systems/hm3/templates/chat/standard-test-card.hbs';

        const chatTemplateData = {
            description: isSuccess ? 'Success' : 'Failure',
            isSuccess: isSuccess,
            modifiedTarget: item.system.masteryLevel,
            modifier: 0,
            notes: '',
            origTarget: item.system.masteryLevel,
            rollResult: roll.result,
            rollValue: roll.total,
            sdrIncr: isSuccess ? (specMatch ? 2 : 1) : 0,
            showResult: true,
            title: `${item.name} Skill Development Roll`
        };

        if (specMatch && isSuccess) {
            chatTemplateData.notes = `Since this is a specialized skill of ${specMatch[1]}, ML will be increased by 2`;
        }

        if (!showChatMsg) return chatTemplateData;

        const html = await renderTemplate(chatTemplate, chatTemplateData);

        const messageData = {
            content: html.trim(),
            roll,
            sound: CONFIG.sounds.dice,
            speaker,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            user: game.user.id
        };

        // Create a chat message
        ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
        await ChatMessage.create(messageData);

        return chatTemplateData;
    }

    /*--------------------------------------------------------------------------------*/
    /*        INJURY ROLL PROCESSING
    /*--------------------------------------------------------------------------------*/

    /**
     * Performs processing, including a random roll, to determine
     * injury location and effects.
     *
     * @param {Object} rollData
     */
    static async injuryRoll(rollData) {
        const speaker = rollData.speaker || ChatMessage.getSpeaker({actor: rollData.actor});

        let result = null;
        if (typeof rollData.impact == 'undefined') {
            let hitLocations = DiceHM3._getHitLocations(rollData.actor.items);

            const dialogOptions = {
                actor: rollData.actor,
                data: rollData.actor.system,
                hitLocations: hitLocations,
                items: rollData.actor.items
            };

            // Create the Roll instance
            result = await DiceHM3.injuryDialog(dialogOptions);
        } else {
            result = DiceHM3._calcInjury(
                rollData.location ? rollData.location : 'Random',
                rollData.impact,
                rollData.aspect,
                game.settings.get('hm3', 'addInjuryToActorSheet') !== 'disable',
                rollData.aim,
                rollData
            );
        }

        // If user cancelled the roll, then return immediately
        if (!result) return null;

        if (result && rollData.tokenId) result.tokenId = rollData.tokenId;
        if (result && rollData.atkToken) result.atkToken = rollData.atkToken;

        if (result.addToCharSheet) {
            DiceHM3.createInjury(rollData.actor, result);
        }

        // Prepare for Chat Message
        const chatTemplate = 'systems/hm3/templates/chat/injury-card.hbs';

        const chatTemplateData = foundry.utils.mergeObject(
            {
                opponentTokenId: rollData.atkToken?.id,
                isShockRoll: result.injuryLevel > 0 && !rollData.actor.hasCondition(Condition.INANIMATE),
                title: `${rollData.actor.token ? rollData.actor.token.name : rollData.actor.name} Injury`,
                visibleActorId: rollData.actor.id
            },
            result
        );

        const html = await renderTemplate(chatTemplate, chatTemplateData);

        const messageData = {
            speaker: speaker,
            content: html.trim(),
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
            sound: CONFIG.sounds.notify
        };

        const messageOptions = {
            rollMode: game.settings.get('core', 'rollMode')
        };

        // Create a chat message
        await ChatMessage.create(messageData, messageOptions);
        if (game.settings.get('hm3', 'combatAudio')) {
            foundry.audio.AudioHelper.play(
                {
                    src: 'systems/hm3/audio/grunt1.ogg',
                    autoplay: true,
                    loop: false
                },
                true
            );
        }
        return result;
    }

    /**
     *
     * @param {*} actor
     * @param {*} result
     */
    static createInjury(actor, result) {
        const injuryDesc = {
            'Blunt': {'M': 'Bruise', 'S': 'Fracture', 'G': 'Crush'},
            'Edged': {'M': 'Cut', 'S': 'Slash', 'G': 'Gash'},
            'Fire': {'M': 'Singe', 'S': 'Burn', 'G': 'Scorch'},
            'Frost': {'M': 'Chilled Flesh', 'S': 'Frostbite', 'G': 'Frostbite'},
            'Piercing': {'M': 'Poke', 'S': 'Stab', 'G': 'Impale'}
        };

        if (result.injuryLevel === 0) return;

        let sev;
        if (result.injuryLevel === 1) {
            sev = 'M';
        } else if (result.injuryLevel <= 3) {
            sev = 'S';
        } else {
            sev = 'G';
        }

        let locationName = result.location;
        if (injuryDesc[result.aspect]) {
            locationName = `${result.location} ${injuryDesc[result.aspect][sev]}`;
        }

        const from = result.atkToken?.name;
        const dateTime = SimpleCalendar?.api?.currentDateTimeDisplay();
        let notes = '';
        notes += from ? `From '${from}' in '${game.scenes.current.name}' ` : `In '${game.scenes.current.name}' `;
        notes += dateTime
            ? `${dateTime.date} ${dateTime.yearPostfix} (Aspect: ${result.aspect})`
            : `(Aspect: ${result.aspect})`;

        let item = Item.create(
            {
                name: locationName,
                type: 'injury',
                system: {
                    aspect: result.aspect,
                    healRate: 0,
                    injuryLevel: result.injuryLevel,
                    notes,
                    severity: sev,
                    subType: InjuryType.HEALING // bloodloss, disease, healing, infection, poison, shock, toxin (different healing rolls)
                }
            },
            {parent: actor}
        );

        return item;
    }

    /**
     * Returns a list of unique hit location names, including a single "Random" entry.
     * Used for filling a dropdown during hit-location calculation.
     *
     * @param {*} items List of items including armorlocation items
     */
    static _getHitLocations(items) {
        // Initialize list with an indicator for a Random roll
        let hitLocations = ['Random'];

        // get a list of unique hit location names
        items.forEach((it) => {
            if (it.type === ItemType.ARMORLOCATION) {
                if (hitLocations.indexOf(it.name) === -1) {
                    hitLocations.push(it.name);
                }
            }
        });

        return hitLocations;
    }

    /**
     * Render a dialog box for gathering information for use in the Injury roll
     *
     * @param {*} dialogOptions
     */
    static async injuryDialog(dialogOptions) {
        const recordInjury = game.settings.get('hm3', 'addInjuryToActorSheet');

        // Render modal dialog
        let dlgTemplate = dialogOptions.template || 'systems/hm3/templates/dialog/injury-dialog.hbs';
        let dialogData = {
            aim: 'mid',
            location: 'Random',
            impact: 0,
            aspect: Aspect.BLUNT,
            askRecordInjury: recordInjury === 'ask',
            hitLocations: dialogOptions.hitLocations
        };

        const html = await renderTemplate(dlgTemplate, dialogData);

        // Create the dialog window
        return Dialog.prompt({
            title: dialogOptions.label,
            content: html.trim(),
            label: 'Determine Injury',
            callback: async (html) => {
                const form = html[0].querySelector('form');
                const formAim = form.aim.value;
                const formAspect = form.aspect.value;
                const formDice = form.dice.value;
                const formImpact = await game.hm3.macros.rollResultAsync(formDice + '+' + form.impact.value, {
                    name: dialogOptions.actor.name,
                    type: 'injuryRoll'
                });
                const formLocation = form.location.value;
                const formAddToCharSheet = dialogData.askRecordInjury
                    ? form.addToCharSheet.checked
                    : recordInjury === 'enable';
                return DiceHM3._calcInjury(
                    formLocation,
                    formImpact,
                    formAspect,
                    formAddToCharSheet,
                    formAim,
                    dialogOptions
                );
            }
        });
    }

    /**
     * This method calculates many items related to injuries that are used to populate
     * the chat message with the results of the injury
     *
     * @param {String} location
     * @param {Number} impact
     * @param {String} aspect
     * @param {Boolean} addToCharSheet
     * @param {String} aim
     * @param {Object} dialogOptions
     */
    static _calcInjury(location, impact, aspect, addToCharSheet, aim, dialogOptions) {
        const enableAmputate = game.settings.get('hm3', 'amputation');
        const enableBloodloss = game.settings.get('hm3', 'bloodloss');
        const enableLimbInjuries = game.settings.get('hm3', 'limbInjuries');

        const result = {
            addToCharSheet: addToCharSheet,
            aim: aim,
            armorType: 'None',
            armorValue: 0,
            aspect: aspect,
            effectiveImpact: impact,
            impact: impact,
            injuryLevel: 0,
            injuryLevelText: 'NA',
            isAmputate: false,
            isBleeder: false,
            isFumble: false,
            isFumbleRoll: false,
            isInjured: false,
            isKillShot: false,
            isRandom: location === 'Random',
            isStumble: false,
            isStumbleRoll: false,
            location: location,
            name: dialogOptions.name,
            noArmor: dialogOptions.noArmor || false,
            type: 'injury'
        };

        // determine location of injury
        const armorLocationItem = DiceHM3._calcLocation(location, aim, dialogOptions.items);
        if (!armorLocationItem) return; // this means we couldn't find the location, so no injury

        // Just to make life simpler, get the data element which is what we really care about.
        const armorLocationData = armorLocationItem.system;

        result.location = armorLocationItem.name;
        result.armorType = armorLocationData.layers === '' || dialogOptions.noArmor ? 'None' : armorLocationData.layers;

        // determine effective impact (impact - armor)
        if (!dialogOptions.noArmor) {
            if (aspect === Aspect.BLUNT) {
                result.armorValue = armorLocationData.blunt;
            } else if (aspect === Aspect.EDGED) {
                result.armorValue = armorLocationData.edged;
            } else if (aspect === Aspect.PIERCING) {
                result.armorValue = armorLocationData.piercing;
            } else {
                result.armorValue = armorLocationData.fire;
            }
        }

        result.effectiveImpact = Math.max(impact - result.armorValue, 0);

        // Determine Injury Level
        if (result.effectiveImpact === 0) {
            result.injuryLevelText = 'NA';
        } else if (result.effectiveImpact >= 17) {
            result.injuryLevelText = armorLocationData.effectiveImpact.ei17;
        } else if (result.effectiveImpact >= 13) {
            result.injuryLevelText = armorLocationData.effectiveImpact.ei13;
        } else if (result.effectiveImpact >= 9) {
            result.injuryLevelText = armorLocationData.effectiveImpact.ei9;
        } else if (result.effectiveImpact >= 5) {
            result.injuryLevelText = armorLocationData.effectiveImpact.ei5;
        } else {
            result.injuryLevelText = armorLocationData.effectiveImpact.ei1;
        }

        if (dialogOptions.actor.hasCondition(Condition.INANIMATE) && result.injuryLevelText[0] === 'K') {
            result.injuryLevelText = result.injuryLevelText.replace('K', 'G');
        }

        // Calculate injury level and whether it is a kill shot.
        // Convert all 'K4' and 'K5' to 'G4' and 'G5'
        switch (result.injuryLevelText) {
            case 'M1':
                result.injuryLevel = 1;
                break;

            case 'S2':
                result.injuryLevel = 2;
                break;

            case 'S3':
                result.injuryLevel = 3;
                break;

            case 'G4':
                result.injuryLevel = 4;
                result.isAmputate = enableAmputate && armorLocationData.isAmputate && aspect === Aspect.EDGED;
                break;

            case 'K4':
                result.injuryLevel = 4;
                result.isKillShot = true;
                result.isAmputate = enableAmputate && armorLocationData.isAmputate && aspect === Aspect.EDGED;
                break;

            case 'G5':
                result.injuryLevel = 5;
                result.isAmputate = enableAmputate && armorLocationData.isAmputate && aspect === Aspect.EDGED;
                break;

            case 'K5':
                result.injuryLevel = 5;
                result.isKillShot = true;
                result.isAmputate = enableAmputate && armorLocationData.isAmputate && aspect === Aspect.EDGED;
                break;

            case 'NA':
                result.injuryLevel = 0;
                break;
        }

        // Either mark as injured, or if not injured just immediately return.
        if (result.injuryLevel > 0) {
            result.isInjured = true;
        } else {
            return result;
        }

        // Optional Rule - Bloodloss (Combat 14)
        result.isBleeder = enableBloodloss && result.injuryLevel >= 4 && result.aspect != Aspect.FIRE;

        // Optional Rule - Limb Injuries (Combat 14)
        if (armorLocationData.isFumble && !dialogOptions.actor.hasCondition(Condition.NO_FUMBLE)) {
            result.isFumble = enableLimbInjuries && result.injuryLevel >= 4;
            result.isFumbleRoll = enableLimbInjuries || (!result.isFumble && result.injuryLevel >= 2);
        }

        // Optional Rule - Limb Injuries (Combat 14)
        if (armorLocationData.isStumble && !dialogOptions.actor.hasCondition(Condition.NO_STUMBLE)) {
            result.isStumble = enableLimbInjuries && result.injuryLevel >= 4;
            result.isStumbleRoll = enableLimbInjuries || (!result.isStumble && result.injuryLevel >= 2);
        }

        return result;
    }

    /**
     * Return either the item specified by location, or if location === 'Random',
     * then randomly chooses a location and returns the item associated with it.
     *
     * @param {*} location
     * @param {*} aim
     * @param {*} items
     */
    static _calcLocation(location, aim, items) {
        const lcAim = aim.toLowerCase();
        let result = null;
        if (location.toLowerCase() === 'random') {
            // First, get total of all probWeight for a given aim
            let totalWeight = 0;
            let numArmorLocations = 0;
            items.forEach((it) => {
                if (it.type === ItemType.ARMORLOCATION) {
                    totalWeight += it.system.probWeight[lcAim];
                    numArmorLocations++;
                }
            });

            // if no armorlocations found, then return null
            if (numArmorLocations === 0) {
                return null;
            }

            if (totalWeight % 100) {
                if (game.user.isGM)
                    ui.notifications.warn(
                        `Armor prob weight is NOT equal to 100, 1000 or 10000. ${location} ${aim} ${
                            items.contents.length ? items.contents[0].parent.name : 'Unknown'
                        } ${totalWeight}`,
                        {permanent: true}
                    );
            }

            // At this point, we know we found armorlocations,
            // but it is possible that they all have a weight
            // of zero.  In that case, we will end up just
            // picking the first one.

            // Assuming we have found some weights, we can now
            // roll to get a random number.
            let rollWeight = 0;
            if (totalWeight > 0) {
                rollWeight = Math.floor(foundry.dice.MersenneTwister.random() * totalWeight) + 1;
            }

            // find the location that meets that number
            let done = false;
            items.forEach((it) => {
                if (!done && it.type === ItemType.ARMORLOCATION) {
                    rollWeight -= it.system.probWeight[lcAim];
                    if (rollWeight <= 0) {
                        result = it;
                        done = true;
                    }
                }
            });
        } else {
            // Not random, let's just find the designated item
            items.forEach((it) => {
                if (result === null && it.type === ItemType.ARMORLOCATION && it.name === location) {
                    result = it;
                }
            });
        }

        return result;
    }

    /*--------------------------------------------------------------------------------*/
    /*        GENERAL DAMAGE ROLL PROCESSING
    /*--------------------------------------------------------------------------------*/

    /**
     * Performs a damage roll, presenting a dialog
     * to collect information about the damage.
     *
     * rollData is expected to contain the following values:
     *  weapon: Selected weapon (or blank for none)
     *  speaker: the Speaker to use in Chat
     *  rollMode: the rollMode to use
     *  actorData: actor data
     *
     * @param {Object} rollData
     */
    static async damageRoll(rollData) {
        const speaker = rollData.speaker || ChatMessage.getSpeaker();

        let weapon = DiceHM3.calcWeaponAspect(rollData.weapon, rollData.data.items);

        const dialogOptions = {
            type: 'damage',
            weapon: rollData.weapon,
            weaponAspect: rollData.aspect ? rollData.aspect : weapon.defaultAspect,
            weaponAspects: weapon.aspects,
            data: rollData.actorData
        };

        // Create the Roll instance
        const roll = await DiceHM3.damageDialog(dialogOptions);

        // If user cancelled the roll, then return immediately
        if (!roll) return null;

        // Prepare for Chat Message
        const chatTemplate = 'systems/hm3/templates/chat/damage-card.hbs';

        let title = 'Other Weapon Damage';
        if (rollData.weapon != '') {
            title = `${rollData.weapon} Damage`;
        }

        const totalImpact = weapon.aspects[roll.chosenAspect] + roll.addlWeaponImpact + roll.rollObj.total;

        const notesData = foundry.utils.mergeObject(rollData.notesData, {
            actor: speaker.alias,
            aspect: roll.chosenAspect,
            dice: Number(roll.damageDice),
            impact: weapon.aspects[roll.chosenAspect],
            addlImpact: roll.addlWeaponImpact,
            totalImpact: totalImpact,
            roll: roll.rollObj.total
        });
        const renderedNotes = rollData.notes ? utility.stringReplacer(rollData.notes, notesData) : '';

        const chatTemplateData = {
            title: title,
            weaponAspect: roll.chosenAspect,
            damageDice: Number(roll.damageDice),
            weaponImpact: weapon.aspects[roll.chosenAspect],
            addlWeaponImpact: roll.addlWeaponImpact,
            totalImpact: totalImpact,
            impactRoll: roll.rollObj.dice[0].values.join(' + '),
            rollValue: roll.rollObj.total,
            notes: renderedNotes,
            roll: roll
        };
        const html = await renderTemplate(chatTemplate, chatTemplateData);

        const messageData = {
            content: html.trim(),
            roll: roll.rollObj,
            sound: CONFIG.sounds.dice,
            speaker: speaker,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            user: game.user.id
        };

        const messageOptions = {};

        // Create a chat message
        ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
        await ChatMessage.create(messageData, messageOptions);

        return chatTemplateData;
    }

    /**
     * Returns a structure specifying the default aspect for a weapon, as well as the
     * impact values for all other aspects.  The default aspect is always the aspect
     * with the greatest impact.
     *
     * @param {*} weapon Name of weapon
     * @param {*} items List of items containing 'weapongear' items.
     */
    static calcWeaponAspect(weapon, items) {
        // Note that although "Fire" is in this list, because it is a
        // type of damage, no normal weapon uses it as its aspect.
        // It is here so that it can be selected (no default impact
        // damage would be specified for that aspect).
        const result = {
            defaultAspect: 'Other',
            aspects: {
                'Blunt': 0,
                'Edged': 0,
                'Fire': 0,
                'Frost': 0,
                'Piercing': 0,
                'Other': 0
            }
        };

        // Search for the specified weapon, and then choose the aspect with
        // the greatest impact (this will become the default aspect)
        items.forEach((it) => {
            const itemData = it.system;
            if (it.type === 'weapongear' && it.name === weapon) {
                let maxImpact = Math.max(itemData.blunt, itemData.piercing, itemData.edged, 0);
                result.aspects[Aspect.BLUNT] = itemData.blunt;
                result.aspects[Aspect.EDGED] = itemData.edged;
                result.aspects[Aspect.PIERCING] = itemData.piercing;
                if (maxImpact === itemData.piercing) {
                    result.defaultAspect = Aspect.PIERCING;
                } else if (maxImpact === itemData.edged) {
                    result.defaultAspect = Aspect.EDGED;
                } else if (maxImpact === itemData.blunt) {
                    result.defaultAspect = Aspect.BLUNT;
                } else {
                    // This shouldn't happen, but if all else fails, choose "Other"
                    result.defaultAspect = 'Other';
                }
            }
        });

        return result;
    }

    /**
     * Renders a dialog to get the information for a damage roll, and then
     * perform a number of d6 dice rolls to determine results.  Returns Roll object
     * representing outcome of die rolls, or null if user cancelled dialog.
     *
     * @param {*} dialogOptions
     */
    static async damageDialog(dialogOptions) {
        // Render modal dialog
        let dlgTemplate = dialogOptions.template || 'systems/hm3/templates/dialog/damage-dialog.hbs';
        let dialogData = {
            weapon: dialogOptions.weapon,
            damageDice: 1,
            weaponAspect: dialogOptions.weaponAspect,
            weaponAspects: dialogOptions.weaponAspects,
            addlWeaponImpact: 0
        };
        const html = await renderTemplate(dlgTemplate, dialogData);

        // Create the dialog window
        return Dialog.prompt({
            title: dialogOptions.label,
            content: html.trim(),
            label: 'Roll',
            callback: async (html) => {
                const form = html[0].querySelector('form');
                const formAddlWeaponImpact = Number(form.addlWeaponImpact.value);
                const formDamageDice = Number(form.damageDice.value);
                const formWeaponAspect = form.weaponAspect.value;
                let roll = await DiceHM3.rollTest({
                    type: dialogOptions.type,
                    target: 0,
                    data: dialogOptions.data,
                    diceSides: 6,
                    diceNum: formDamageDice,
                    modifier: 0
                });
                let result = {
                    type: roll.type,
                    chosenAspect: formWeaponAspect,
                    damageDice: formDamageDice,
                    addlWeaponImpact: formAddlWeaponImpact,
                    rollObj: roll.rollObj
                };
                return result;
            }
        });
    }

    /*--------------------------------------------------------------------------------*/
    /*        MISSILE ATTACK ROLL PROCESSING
    /*--------------------------------------------------------------------------------*/

    static async missileAttackRoll(rollData) {
        const speaker = rollData.speaker || ChatMessage.getSpeaker();

        // Create the Roll instance
        const roll = await DiceHM3.missileAttackDialog(rollData);

        // If user cancelled the roll, then return immediately
        if (!roll) return null;

        // Prepare for Chat Message
        const chatTemplate = 'systems/hm3/templates/chat/missile-attack-card.hbs';

        const notesData = foundry.utils.mergeObject(rollData.notesData, {
            actor: speaker.alias,
            aspect: rollData.aspect,
            range: roll.range,
            rangeModifier: roll.rangeModifier,
            addlModifier: roll.addlModifier,
            target: roll.modifiedTarget,
            isSuccess: roll.isSuccess,
            isCritical: roll.isCritical,
            isCS: roll.isSuccess && roll.isCritical,
            isMS: roll.isSuccess && !roll.isCritical,
            isMF: !roll.isSuccess && !roll.isCritical,
            isCF: !roll.isSuccess && roll.isCritical,
            roll: roll.rollObj.total
        });
        const renderedNotes = rollData.notes ? utility.stringReplacer(rollData.notes, notesData) : '';

        const chatTemplateData = {
            title: `${rollData.name} Attack`,
            addlModifier: Math.abs(roll.addlModifier),
            amPlusMinus: roll.addlModifier < 0 ? '-' : '+',
            aspect: rollData.aspect,
            debug: CONFIG.debug.hm3 && game.user.isGM,
            description: roll.description,
            isCritical: roll.isCritical,
            isSuccess: roll.isSuccess,
            modifiedTarget: roll.modifiedTarget,
            notes: renderedNotes,
            origTarget: rollData.target,
            range: roll.range,
            rangeModifier: Math.abs(roll.rangeModifier),
            rmPlusMinus: roll.rangeModifier < 0 ? '-' : '+',
            roll: roll,
            rollFormula: roll.rollObj.formula,
            rollResult: roll.rollObj.result,
            rollValue: roll.rollObj.total
        };
        const html = await renderTemplate(chatTemplate, chatTemplateData);

        const messageData = {
            content: html.trim(),
            roll: roll.rollObj,
            sound: CONFIG.sounds.dice,
            speaker: speaker,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            user: game.user.id
        };

        const messageOptions = {};

        // Create a chat message
        ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
        await ChatMessage.create(messageData, messageOptions);

        return chatTemplateData;
    }

    static async missileAttackDialog(dialogOptions) {
        // Render modal dialog
        let dlgTemplate = dialogOptions.template || 'systems/hm3/templates/dialog/attack-dialog.hbs';

        let dialogData = {
            aimLocations: ['High', 'Mid', 'Low'],
            defaultAim: 'Mid',
            target: dialogOptions.target
        };

        const shortDesc = `Short (${dialogOptions.rangeShort})`;
        const mediumDesc = `Medium (${dialogOptions.rangeMedium})`;
        const longDesc = `Long (${dialogOptions.rangeLong})`;
        const extremeDesc = `Extreme (${dialogOptions.rangeExtreme})`;
        dialogData.ranges = {};
        dialogData.ranges[shortDesc] = 'Short';
        dialogData.ranges[mediumDesc] = 'Medium';
        dialogData.ranges[longDesc] = 'Long';
        dialogData.ranges[extremeDesc] = 'Extreme';
        dialogData.rangeExceedsExtreme = false;
        dialogData.defaultRange = extremeDesc;

        const html = await renderTemplate(dlgTemplate, dialogData);
        const title = `${dialogOptions.name} Attack`;

        // Create the dialog window
        return Dialog.prompt({
            title: dialogOptions.label,
            content: html.trim(),
            label: 'Roll',
            callback: async (html) => {
                const form = html[0].querySelector('form');
                const formAddlModifier = Number(form.addlModifier.value);
                let formRange = form.range.value;
                let rangeModifier;
                if (formRange === shortDesc) {
                    rangeModifier = 0;
                    formRange = 'Short';
                } else if (formRange === mediumDesc) {
                    rangeModifier = -20;
                    formRange = 'Medium';
                } else if (formRange === longDesc) {
                    rangeModifier = -40;
                    formRange = 'Long';
                } else {
                    rangeModifier = -80;
                    formRange = 'Extreme';
                }

                let roll = await DiceHM3.rollTest({
                    type: dialogOptions.type,
                    target: dialogOptions.target,
                    data: dialogOptions.data,
                    diceSides: 100,
                    diceNum: 1,
                    modifier: formAddlModifier + rangeModifier
                });

                let result = {
                    type: roll.type,
                    origTarget: dialogOptions.target,
                    range: formRange,
                    rangeModifier: rangeModifier,
                    addlModifier: formAddlModifier,
                    modifiedTarget: Number(dialogOptions.target) + rangeModifier + formAddlModifier,
                    isSuccess: roll.isSuccess,
                    isCritical: roll.isCritical,
                    description: roll.description,
                    rollObj: roll.rollObj
                };
                return result;
            }
        });
    }

    /*--------------------------------------------------------------------------------*/
    /*        MISSILE DAMAGE ROLL PROCESSING
    /*--------------------------------------------------------------------------------*/

    static async missileDamageRoll(rollData) {
        const speaker = rollData.speaker || ChatMessage.getSpeaker();

        const dialogOptions = {
            name: rollData.name,
            ranges: {
                'Short': rollData.impactShort,
                'Medium': rollData.impactMedium,
                'Long': rollData.impactLong,
                'Extreme': rollData.impactExtreme
            },
            defaultRange: rollData.defaultRange ? rollData.defaultRange : 'Extreme',
            data: rollData.data
        };

        // Create the Roll instance
        const roll = await DiceHM3.missileDamageDialog(dialogOptions);

        // If user cancelled the roll, then return immediately
        if (!roll) return null;

        // Prepare for Chat Message
        const chatTemplate = 'systems/hm3/templates/chat/missile-damage-card.hbs';

        let title = 'Missile Damage';
        if (rollData.name != '') {
            title = `${rollData.name} Damage`;
        }

        let rangeImpact = 0;
        if (roll.range === 'Short') {
            rangeImpact = rollData.impactShort;
        } else if (roll.range === 'Medium') {
            rangeImpact = rollData.impactMedium;
        } else if (roll.range === 'Long') {
            rangeImpact = rollData.impactLong;
        } else if (roll.range === 'Extreme') {
            rangeImpact = rollData.impactExtreme;
        }

        const totalImpact = Number(rangeImpact) + Number(roll.addlImpact) + Number(roll.rollObj.total);

        const notesData = foundry.utils.mergeObject(rollData.notesData, {
            actor: speaker.alias,
            aspect: rollData.aspect,
            range: roll.range,
            dice: Number(roll.damageDice),
            impact: rangeImpact,
            addlImpact: roll.addlImpact,
            totalImpact: totalImpact,
            roll: roll.rollObj.total
        });
        const renderedNotes = rollData.notes ? utility.stringReplacer(rollData.notes, notesData) : '';

        const chatTemplateData = {
            title: title,
            aspect: rollData.aspect,
            range: roll.range,
            damageDice: Number(roll.damageDice),
            rangeImpact: rangeImpact,
            addlImpact: roll.addlImpact,
            totalImpact: totalImpact,
            rollValue: roll.rollObj.total,
            notes: renderedNotes,
            roll: roll
        };
        const html = await renderTemplate(chatTemplate, chatTemplateData);

        const messageData = {
            content: html.trim(),
            roll: roll.rollObj,
            sound: CONFIG.sounds.dice,
            speaker: speaker,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            user: game.user.id
        };

        const messageOptions = {};

        // Create a chat message
        ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
        await ChatMessage.create(messageData, messageOptions);

        return chatTemplateData;
    }

    static async missileDamageDialog(dialogOptions) {
        // Render modal dialog
        let dlgTemplate = dialogOptions.template || 'systems/hm3/templates/dialog/missile-damage-dialog.hbs';
        let dialogData = {
            name: dialogOptions.name,
            ranges: dialogOptions.ranges,
            defaultRange: dialogOptions.defaultRange
        };
        const html = await renderTemplate(dlgTemplate, dialogData);

        const title = `${dialogOptions.name} Missile Damage`;

        // Create the dialog window
        return Dialog.prompt({
            title: dialogOptions.label,
            content: html.trim(),
            label: 'Roll',
            callback: async (html) => {
                const form = html[0].querySelector('form');
                const formAddlImpact = Number(form.addlImpact.value);
                const formDamageDice = Number(form.damageDice.value);
                const formRange = form.range.value;
                let roll = await DiceHM3.rollTest({
                    type: dialogOptions.type,
                    target: 0,
                    data: dialogOptions.data,
                    diceSides: 6,
                    diceNum: formDamageDice,
                    modifier: 0
                });
                let result = {
                    type: roll.type,
                    range: formRange,
                    damageDice: formDamageDice,
                    addlImpact: formAddlImpact,
                    rollObj: roll.rollObj
                };
                return result;
            }
        });
    }

    /*--------------------------------------------------------------------------------*/
    /*        GENERIC DICE ROLLING PROCESSING
    /*--------------------------------------------------------------------------------*/

    static async rollTest(testData) {
        const diceType = testData.diceSides === 6 ? 'd6' : 'd100';
        const numDice = testData.diceNum > 0 ? testData.diceNum : 1;
        const diceSpec = numDice + diceType;
        const roll = await game.hm3.macros.rollObjectEvaluatedAsync(diceSpec, {
            name: testData.name,
            target: testData.target,
            targetCritical: testData.isTreatment && testData.noTreatment ? false : null, // No Treatment should auto fail with MF
            targetSuccess: testData.isTreatment && testData.noTreatment ? false : null, // No Treatment should auto fail with MF
            type: testData.type
        });

        if (!roll) {
            console.error(`Roll evaluation failed, diceSpec=${diceSpec}`);
        }
        const modifier = Number(testData.modifier);
        const baseTargetNum = Number(testData.target) + modifier;
        // Ensure target num is between 9 and 95; always a 5% chance of success/failure
        const targetNum = diceType === 'd100' ? game.hm3.macros.HM100Check(baseTargetNum) : baseTargetNum;

        let description = '';
        let isCrit = false;
        let isSuccess = false;
        let isSubstantial = false;

        if (diceType === 'd100') {
            isCrit = roll.total % 5 === 0;
            const levelDesc = isCrit ? 'Critical' : 'Marginal';

            // ********** Failure ***********
            if (roll.total > targetNum) {
                description = levelDesc + ' Failure';
            }
            // ********** Success ***********
            else {
                description = levelDesc + ' Success';
                isSuccess = true;
            }
            // ********** Substantial Failure ***********
            if (!isSuccess && roll.total > targetNum + (100 - targetNum) / 2) {
                isSubstantial = true;
                if (!isCrit) description = 'Substantial Failure';
                // if (isCrit) description = 'Substantial ' + description;
                // else description = 'Substantial Failure';
            }
            // ********** Substantial Success ***********
            else if (isSuccess && roll.total <= targetNum / 2) {
                isSubstantial = true;
                if (!isCrit) description = 'Substantial Success';
                // if (isCrit) description = 'Substantial ' + description;
                // else description = 'Substantial Success';
            }
        } else {
            isSuccess = roll.total <= targetNum;
            description = isSuccess ? 'Success' : 'Failure';
        }

        let rollResults = {
            'description': description,
            'isCapped': baseTargetNum !== targetNum,
            'isCritical': isCrit,
            'isSubstantial': isSubstantial,
            'isSuccess': isSuccess,
            'modifier': modifier,
            'preData': testData,
            'rollObj': roll,
            'target': targetNum,
            'type': testData.type
        };
        return rollResults;
    }

    /*--------------------------------------------------------------------------------*/
    /*        UTILITY FUNCTIONS
    /*--------------------------------------------------------------------------------*/

    /**
     *
     * @param {*} options
     * @returns
     */
    static getRollMode(options) {
        options = foundry.utils.mergeObject({skill: null, isAppraisal: false, blind: false, private: false}, options);
        // publicroll, gmroll, blindroll & selfroll (CONST.DICE_ROLL_MODES.BLIND)
        const blind =
            options.blind ||
            game.settings.get('core', 'rollMode') === CONST.DICE_ROLL_MODES.BLIND ||
            ((HM3.blindRolls.includes(options.skill) || options.isAppraisal) &&
                !!game.settings.get('hm3', 'blindGmMode'));
        const rollMode = blind
            ? CONST.DICE_ROLL_MODES.BLIND
            : options.private
            ? CONST.DICE_ROLL_MODES.PRIVATE
            : game.settings.get('core', 'rollMode');

        return rollMode;
    }
}
