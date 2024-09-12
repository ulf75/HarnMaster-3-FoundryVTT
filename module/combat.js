import {HM3} from './config.js';
import {DiceHM3} from './dice-hm3.js';
import {Condition} from './hm3-types.js';

/**
 * Initiates a missile attack.
 *
 * Displays a missile attack dialog asking for attributes of the attack (aim location,
 * special modifiers, etc.) and generates a missile attack chat message that includes
 * buttons for selecting the appropriate defense.
 *
 * No die rolling occurs as a result of this function, only the declaration of the attack.
 *
 * @param attackToken {Token} Token representing attacker
 * @param defendToken {Token} Token representing defender
 * @param weaponItem {Item} Missile weapon used by attacker
 */
export async function missileAttack(attackToken, defendToken, missileItem) {
    if (!attackToken) {
        ui.notifications.warn(`No attacker token identified.`);
        return null;
    }

    if (!isValidToken(attackToken)) {
        ui.notifications.error(`Attack token not valid.`);
        console.error(`HM3 | missileAttack attackToken=${attackToken} is not valid.`);
        return null;
    }

    if (!defendToken) {
        ui.notifications.warn(`No defender token identified.`);
        return null;
    }

    if (!isValidToken(defendToken)) {
        ui.notifications.error(`Defender token not valid.`);
        console.error(`HM3 | missileAttack defendToken=${defendToken} is not valid.`);
        return null;
    }

    if (!attackToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${attackToken.name}`);
        return null;
    }

    if (attackToken.hasCondition(Condition.SHOCKED)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.SHOCKED}'.`);
        return null;
    }

    if (attackToken.hasCondition(Condition.UNCONSCIOUS)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.UNCONSCIOUS}'.`);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: attackToken.document});
    const range = rangeToTarget(attackToken, defendToken);

    const options = {
        distance: Math.round(range),
        type: 'Attack',
        attackerName: attackToken.name,
        defenderName: defendToken.name
    };

    // If a weapon was provided, don't ask for it.
    if (missileItem) {
        if (missileItem.system.isEquipped) {
            options['weapon'] = missileItem;
        } else {
            ui.notifications.warn(`${missileItem.name} is not equipped.`);
            return null;
        }
    } else {
        ui.notifications.warn(`You must specify a missile weapon to use.`);
        return null;
    }

    if (attackToken.actor?.system?.eph?.missileAMLMod !== undefined) {
        options['defaultModifier'] = attackToken.actor.system.eph.missileAMLMod;
    }

    const dialogResult = await attackDialog(options);

    // If user cancelled the dialog, then return immediately
    if (!dialogResult) return null;

    if (!missileItem) {
        missileItem = dialogResult.weapon;
    }

    if (game.settings.get('hm3', 'missileTracking') && attackToken.actor) {
        if (missileItem.system.quantity <= 0) {
            ui.notifications.warn(`No more ${missileItem.name} left, attack denied.`);
            return null;
        }

        const item = attackToken.actor.items.get(missileItem.id);
        item.update({'system.quantity': missileItem.system.quantity - 1});
    }

    dialogResult.addlModifier += dialogResult.aim === 'Mid' ? 0 : -10;
    const effAML = dialogResult.weapon.system.attackMasteryLevel + dialogResult.addlModifier + dialogResult.rangeMod;

    // Prepare for Chat Message
    const chatTemplate = 'systems/hm3/templates/chat/attack-card.html';
    const grappled = defendToken.hasCondition(Condition.GRAPPLED);
    const incapacitated = defendToken.hasCondition(Condition.INCAPACITATED);
    const shocked = defendToken.hasCondition(Condition.SHOCKED);
    const stunned = defendToken.hasCondition(Condition.STUNNED);
    const unconscious = defendToken.hasCondition(Condition.UNCONSCIOUS);

    const chatTemplateData = {
        title: `${missileItem.name} Missile Attack`,
        attacker: attackToken.name,
        atkTokenId: attackToken.id,
        defender: defendToken.name,
        defTokenId: defendToken.id,
        weaponType: 'missile',
        weaponName: missileItem.name,
        rangeText: dialogResult.range,
        rangeExceedsExtreme: dialogResult.rangeExceedsExtreme,
        rangeModSign: dialogResult.rangeMod < 0 ? '-' : '+',
        rangeModifierAbs: Math.abs(dialogResult.rangeMod),
        rangeDist: Math.round(range),
        aim: dialogResult.aim,
        aspect: dialogResult.aspect,
        addlModifierAbs: Math.abs(dialogResult.addlModifier),
        addlModifierSign: dialogResult.addlModifier < 0 ? '-' : '+',
        origAML: missileItem.system.attackMasteryLevel,
        effAML: effAML,
        impactMod: dialogResult.impactMod,
        hasDodge: !(grappled || incapacitated || shocked || stunned || unconscious),
        hasBlock: !(grappled || incapacitated || shocked || stunned || unconscious),
        hasCounterstrike: false, // not possible against missile attacks
        hasIgnore: true,
        visibleActorId: defendToken.actor.id
    };

    const html = await renderTemplate(chatTemplate, chatTemplateData);

    const messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim(),
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
    };

    const messageOptions = {};

    // Create a chat message
    await ChatMessage.create(messageData, messageOptions);
    if (game.settings.get('hm3', 'combatAudio')) {
        foundry.audio.AudioHelper.play({src: 'sounds/drums.wav', autoplay: true, loop: false}, true);
    }

    return chatTemplateData;
}

/**
 * Initiates a melee attack.
 *
 * Displays a melee attack dialog asking for attributes of the attack (aim location,
 * special modifiers, etc.) and generates a melee attack chat message that includes
 * buttons for selecting the appropriate defense.
 *
 * No die rolling occurs as a result of this function, only the declaration of the attack.
 *
 * @param attackToken {Token} Token representing attacker
 * @param defendToken {Token} Token representing defender
 * @param weaponItem {Item} Melee weapon used by attacker
 */
export async function meleeAttack(attackToken, defendToken, weaponItem = null, unarmed = false) {
    if (!attackToken) {
        ui.notifications.warn(`No attacker token identified.`);
        return null;
    }

    if (!isValidToken(attackToken)) {
        console.error(`HM3 | meleeAttack attackToken=${attackToken} is not valid.`);
        return null;
    }

    if (!defendToken) {
        ui.notifications.warn(`No defender token identified.`);
        return null;
    }

    if (!isValidToken(defendToken)) {
        console.error(`HM3 | meleeAttack defendToken=${defendToken} is not valid.`);
        return null;
    }

    if (!attackToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${attackToken.name}`);
        return null;
    }

    if (attackToken.hasCondition(Condition.SHOCKED)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.SHOCKED}'.`);
        return null;
    }

    if (attackToken.hasCondition(Condition.UNCONSCIOUS)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.UNCONSCIOUS}'.`);
        return null;
    }

    const targetRange = rangeToTarget(attackToken, defendToken, true);
    if (targetRange > 1) {
        const msg = `Target ${defendToken.name} is outside of melee range for attacker ${attackToken.name}; range=${targetRange}.`;
        console.warn(msg);
        ui.notifications.warn(msg);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: attackToken.document});

    // display dialog, get aspect, aim, and addl damage
    const options = {
        type: 'Attack',
        attackerName: attackToken.name,
        defenderName: defendToken.name,
        unarmed
    };

    // If a weapon was provided, don't ask for it.
    if (weaponItem) {
        if (weaponItem.system.isEquipped) {
            options['weapon'] = weaponItem;
        } else {
            ui.notifications.warn(`For ${attackToken.name} ${weaponItem.name} is not equipped.`);
            return null;
        }
    } else {
        const defWpns = defaultMeleeWeapon(attackToken);
        if (!defWpns.weapons || !defWpns.weapons.length) {
            ui.notifications.warn(`${attackToken.name} does not have any equipped melee weapons.`);
            return null;
        }
        options['weapons'] = defWpns.weapons;
        options['defaultWeapon'] = defWpns.defaultWeapon;
    }

    options['defaultModifier'] = 0;
    if (attackToken.actor?.system?.eph?.meleeAMLMod !== undefined) {
        options['defaultModifier'] += attackToken.actor.system.eph.meleeAMLMod;
    }

    // A character who is attacking (or being attacked by) a prone enemy increases EML by 20. (COMBAT 11)
    const prone = defendToken.hasCondition(Condition.PRONE);
    if (prone) {
        options['defaultModifier'] += 20;
    }

    const dialogResult = await attackDialog(options);

    // If user cancelled the dialog, then return immediately
    if (!dialogResult) return null;

    if (!weaponItem) {
        weaponItem = dialogResult.weapon;
    }

    dialogResult.addlModifier += dialogResult.aim === 'Mid' ? 0 : -10;
    const effAML = dialogResult.weapon.system.attackMasteryLevel + dialogResult.addlModifier;

    // Prepare for Chat Message
    const chatTemplate = 'systems/hm3/templates/chat/attack-card.html';
    const grappled = defendToken.hasCondition(Condition.GRAPPLED);
    const incapacitated = defendToken.hasCondition(Condition.INCAPACITATED);
    const shocked = defendToken.hasCondition(Condition.SHOCKED);
    const stunned = defendToken.hasCondition(Condition.STUNNED);
    const unconscious = defendToken.hasCondition(Condition.UNCONSCIOUS);

    const type = dialogResult.isGrappleAtk ? 'Grapple' : 'Melee';
    const chatTemplateData = {
        title: `${weaponItem.name} ${type} Attack`,
        attacker: attackToken.name,
        atkTokenId: attackToken.id,
        defender: defendToken.name,
        defTokenId: defendToken.id,
        weaponType: 'melee',
        weaponName: weaponItem.name,
        aim: dialogResult.aim,
        aspect: dialogResult.aspect,
        addlModifierAbs: Math.abs(dialogResult.addlModifier),
        addlModifierSign: dialogResult.addlModifier < 0 ? '-' : '+',
        origAML: weaponItem.system.attackMasteryLevel,
        effAML: effAML,
        impactMod: dialogResult.impactMod,
        hasDodge: !(grappled || incapacitated || shocked || stunned || unconscious),
        hasBlock: !(grappled || incapacitated || shocked || stunned || unconscious) && !dialogResult.isGrappleAtk,
        hasCounterstrike: !(incapacitated || shocked || stunned || unconscious),
        hasIgnore: true,
        visibleActorId: defendToken.actor.id,
        isGrappleAtk: !!dialogResult.isGrappleAtk
    };

    const html = await renderTemplate(chatTemplate, chatTemplateData);

    const messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim(),
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
    };

    const messageOptions = {};

    // Create a chat message
    await ChatMessage.create(messageData, messageOptions);
    if (game.settings.get('hm3', 'combatAudio')) {
        foundry.audio.AudioHelper.play({src: 'sounds/drums.wav', autoplay: true, loop: false}, true);
    }

    return chatTemplateData;
}

/**
 * Displays a dialog asking user to choose a weapon (and optionally a modifier).
 *
 * Options:
 * name (String): name of actor to select the weapon
 * weapons (Array<Item>) a list of items (weapongear or missilegear)
 * defaultWeapon (Item) the default item choice
 * modifierType (string) A word to put between "Additional ??? Modifier"
 *
 * @param {Object} options
 */
async function selectWeaponDialog(options) {
    let queryWeaponDialog = 'systems/hm3/templates/dialog/query-weapon-dialog.html';

    const dialogOptions = {
        title: `${options.name} Select Weapon`
    };
    dialogOptions.weapons = options.weapons.map((w) => w.name);
    dialogOptions.defaultWeapon = options.defaultWeapon;
    dialogOptions.defaultModifier = options.defaultModifier || 0;
    if (options.modifierType) {
        dialogOptions.modifierType = options.modifierType;
    }
    dialogOptions.prompt = options.prompt ? options.prompt : 'Please select your weapon';

    const dlghtml = await renderTemplate(queryWeaponDialog, dialogOptions);

    // Request weapon name
    return Dialog.prompt({
        title: dialogOptions.title,
        content: dlghtml.trim(),
        label: 'OK',
        callback: (html) => {
            const form = html[0].querySelector('form');
            const formAddlModifier = form.addlModifier ? parseInt(form.addlModifier.value) : 0;
            const formWeapon = form.weapon.value;

            return {weapon: formWeapon, addlModifier: formAddlModifier};
        }
    });
}

/**
 * Queries for the weapon to use, and additional weapon parameters (aim, aspect, range).
 *
 * options should include:
 * attackerName (String): The name of the attacker
 * defenderName (String): The name of the defender
 * weapons (Array<Item>): a list of Items, available weapons to choose from
 * defaultWeapon (string): default choice (Item name) from weapon list
 * weapon (Item): if provided, this weapon Item will be used and no weapon query performed
 * type (string): either 'Block', 'Attack', or 'Counterstrike'
 * distance (number): the distance to the target
 *
 * The return value will be an object with the following keys:
 *  weapon (Item):      An Item representing the weapon (weapongear or missilegear)
 *  aspect (string):    The aspect (Blunt, Edged, Piercing)
 *  aim (string):       The aim location (High, Mid, Low)
 *  addlModifier (number): Modifier to the attack roll (AML)
 *  range (string):     The range to target (Short, Medium, Long, Extreme)
 *  rangeExceedsExtreme (boolean): Whether the distance to target exceeds its extreme range
 *  impactMod (number): Weapon impact modifier (based on weapon aspect or range)
 *
 * @param {Object} options
 */
async function attackDialog(options) {
    if (options.weapons) {
        const equippedWeapons = options.weapons.filter((w) => w.system.isEquipped);
        options.weapons = equippedWeapons;
    }

    if (!options.weapon && options.weapons && options.weapons.length) {
        options.name = options.attackerName;
        const result = await selectWeaponDialog(options);

        if (result) {
            options.weapon = options.weapons.find((w) => result.weapon === w.name);
            // If an attack is carried out unarmed, you can select the GRAPPLE option.
            options.unarmed = options.weapon.system.assocSkill.toLowerCase().includes('unarmed');
        }
    }

    if (!options.weapon) {
        ui.notifications.warn(`${attackerName} has no equipped weapons available for attack.`);
        return null;
    }

    const dialogOptions = {
        weapon: options.weapon.name,
        aimLocations: [
            {key: 'Low', label: 'Low (-10)'},
            {key: 'Mid', label: 'Mid (+0)'},
            {key: 'High', label: 'High (-10)'}
        ],
        defaultAim: 'Mid',
        defaultModifier: options.defaultModifier || 0,
        unarmed: options.unarmed
    };

    if (options.weapon.type === 'weapongear') {
        dialogOptions.title = `Weapon ${options.type} with ${options.weapon.name}`;
        const weaponAspect = calcWeaponAspect(options.weapon);
        if (!weaponAspect.defaultAspect) return null; // no aspects available, shouldn't happen
        foundry.utils.mergeObject(dialogOptions, weaponAspect);
    } else if (options.weapon.type === 'missilegear') {
        dialogOptions.title = `Missile ${options.type} with ${options.weapon.name}`;

        const weaponData = options.weapon.system;

        // Missiles only have a single weapon aspect
        dialogOptions.aspects = {};
        dialogOptions.aspects[weaponData.weaponAspect] = -1;
        dialogOptions.defaultAspect = weaponData.weaponAspect;

        const isGridDistanceUnits = game.settings.get('hm3', 'distanceUnits') === 'grid';
        const dist = canvas.dimensions.distance;
        const shortDesc = `Short (${isGridDistanceUnits ? weaponData.range.short / dist + ' hex' : weaponData.range.short + ' ft'}/+0)`;
        const mediumDesc = `Medium (${isGridDistanceUnits ? weaponData.range.medium / dist + ' hex' : weaponData.range.medium + ' ft'}/-20)`;
        const longDesc = `Long (${isGridDistanceUnits ? weaponData.range.long / dist + ' hex' : weaponData.range.long + ' ft'}/-40)`;
        const extremeDesc = `Extreme (${isGridDistanceUnits ? weaponData.range.extreme / dist + ' hex' : weaponData.range.extreme + ' ft'}/-80)`;
        dialogOptions.ranges = [
            {key: 'Short', label: shortDesc, impact: weaponData.impact.short},
            {key: 'Medium', label: mediumDesc, impact: weaponData.impact.medium},
            {key: 'Long', label: longDesc, impact: weaponData.impact.long},
            {key: 'Extreme', label: extremeDesc, impact: weaponData.impact.extreme}
        ];
        dialogOptions.rangeExceedsExtreme = false;

        // Set range based on distance
        if (options.distance) {
            dialogOptions.isGridDistanceUnits = isGridDistanceUnits;
            dialogOptions.distance = options.distance;
            dialogOptions.distanceGrid = options.distance / dist;
            if (options.distance <= weaponData.range.short) {
                dialogOptions.defaultRange = 'Short';
            } else if (options.distance <= weaponData.range.medium) {
                dialogOptions.defaultRange = 'Medium';
            } else if (options.distance <= weaponData.range.long) {
                dialogOptions.defaultRange = 'Long';
            } else if (options.distance <= weaponData.range.extreme) {
                dialogOptions.defaultRange = 'Extreme';
            } else {
                dialogOptions.defaultRange = 'Extreme';
                dialogOptions.rangeExceedsExtreme = true;
            }
        } else {
            // Distance not specified, set it to extreme by default
            dialogOptions.defaultRange = 'Extreme';
        }
    } else {
        // Not a weapon!!
        return null;
    }

    dialogOptions.title = `${options.attackerName} vs. ${options.defenderName} ${options.type} with ${options.weapon.name}`;

    const attackDialogTemplate = 'systems/hm3/templates/dialog/attack-dialog.html';
    const dlghtml = await renderTemplate(attackDialogTemplate, dialogOptions);

    // Request weapon details
    return Dialog.prompt({
        title: dialogOptions.title,
        content: dlghtml.trim(),
        label: options.type,
        callback: (html) => {
            const form = html[0].querySelector('form');
            const formRange = form.range ? form.range.value : null;
            const isGrappleAtk = form[3]?.checked || false;

            // const addlModifier = (form.addlModifier ? parseInt(form.addlModifier.value) : 0) + (form.aim?.value !== 'Mid' ? -10 : 0);
            const result = {
                weapon: options.weapon,
                aspect: form.weaponAspect ? form.weaponAspect.value : null,
                aim: form.aim ? form.aim.value : null,
                addlModifier: form.addlModifier ? parseInt(form.addlModifier.value) : 0,
                range: formRange,
                rangeExceedsExtreme: dialogOptions.rangeExceedsExtreme,
                impactMod: 0,
                isGrappleAtk
            };

            if (formRange) {
                // Grab range and impact mod (from selected range) for missile weapon
                if (formRange.startsWith('Short')) {
                    result.range = 'Short';
                    result.rangeMod = 0;
                } else if (formRange.startsWith('Medium')) {
                    result.range = 'Medium';
                    result.rangeMod = -20;
                } else if (formRange.startsWith('Long')) {
                    result.range = 'Long';
                    result.rangeMod = -40;
                } else {
                    result.range = 'Extreme';
                    result.rangeMod = -80;
                }
                result.impactMod =
                    dialogOptions.ranges.filter((r) => {
                        return r.key === result.range;
                    })[0].impact || 0;
            } else {
                // Grab impact mod (from selected aspect) for melee weapon
                result.impactMod = dialogOptions.aspects[result.aspect] || 0;
            }
            return result;
        }
    });
}

/**
 * Determine if the token is valid (must be either a 'creature' or 'character')
 *
 * @param {Token} token
 */
function isValidToken(token) {
    if (!token) {
        ui.notifications.warn('No token selected.');
        return false;
    }

    if (!token.actor) {
        ui.notifications.warn(`Token ${token.name} is not a valid actor.`);
        return false;
    }

    if (['character', 'creature'].includes(token.actor.type)) {
        return true;
    } else {
        ui.notifications.warn(`Token ${token.name} is not a character or creature.`);
        return false;
    }
}

/**
 * Determine default melee weapon based on maximum impact.
 *
 * @param {Token} token
 */
function defaultMeleeWeapon(token) {
    if (!isValidToken(token)) return {weapons: [], defaultWeapon: null};

    const equippedWeapons = token.actor.itemTypes.weapongear.filter((w) => w.system.isEquipped);
    let defaultWeapon = null;
    if (equippedWeapons.length > 0) {
        let maxImpact = -1;
        equippedWeapons.forEach((w) => {
            const data = w.system;
            const impactMax = Math.max(data.blunt, data.edged, data.piercing);
            if (impactMax > maxImpact) {
                maxImpact = impactMax;
                defaultWeapon = w;
            }
        });
    }

    return {
        weapons: equippedWeapons,
        defaultWeapon: defaultWeapon
    };
}

/**
 * Resume the attack with the defender performing the "Counterstrike" defense.
 * Note that this defense is only applicable to melee attacks.
 *
 * @param {*} atkToken Token representing the attacker
 * @param {*} defToken Token representing the defender
 * @param {*} atkWeaponName Name of the weapon the attacker is using
 * @param {*} atkEffAML The effective AML (Attack Mastery Level) of the attacker after modifiers applied
 * @param {*} atkAim Attack aim ("High", "Mid", "Low")
 * @param {*} atkAspect Weapon aspect ("Blunt", "Edged", "Piercing")
 * @param {*} atkImpactMod Additional modifier to impact
 */
export async function meleeCounterstrikeResume(atkToken, defToken, atkWeaponName, atkEffAML, atkAim, atkAspect, atkImpactMod, isGrappleAtk) {
    if (!isValidToken(atkToken) || !isValidToken(defToken)) return null;
    if (!defToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${attackToken.name}`);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: atkToken.document});

    // Get weapon with maximum impact
    const options = defaultMeleeWeapon(defToken);

    if (!options.weapons) {
        ui.notifications.warn(`${defToken.name} has no equipped weapons, counterstrike defense refused.`);
        return null;
    }

    options.type = 'Counterstrike';
    options.attackerName = defToken.name;
    options.defenderName = atkToken.name;

    options.defaultModifier = 0;
    if (defToken.actor?.system?.eph?.outnumbered > 1) {
        options.defaultModifier += Math.floor(defToken.actor.system.eph.outnumbered - 1) * -10;
    }

    // A character who is attacking (or being attacked by) a prone enemy increases EML by 20. (COMBAT 11)
    const prone = atkToken.hasCondition(Condition.PRONE);
    if (prone) {
        options.defaultModifier += 20;
    }

    const csDialogResult = await attackDialog(options);
    if (!csDialogResult) return null;

    // Roll Attacker's Attack
    const atkRoll = await DiceHM3.rollTest({
        data: {},
        diceSides: 100,
        diceNum: 1,
        modifier: 0,
        target: atkEffAML
    });

    const csEffEML = csDialogResult.weapon.system.attackMasteryLevel;

    // Roll Counterstrike Attack
    const csRoll = await DiceHM3.rollTest({
        data: {},
        diceSides: 100,
        diceNum: 1,
        modifier: csDialogResult.addlModifier,
        target: csEffEML
    });

    // If we have "Dice So Nice" module, roll them dice!
    if (game.dice3d) {
        const aRoll = atkRoll.rollObj;
        aRoll.dice[0].options.colorset = 'glitterparty';
        await game.dice3d.showForRoll(aRoll, game.user, true);

        const cRoll = csRoll.rollObj;
        cRoll.dice[0].options.colorset = 'bloodmoon';
        await game.dice3d.showForRoll(cRoll, game.user, true);
    }

    // Grapple
    const isGrappleDef = csDialogResult.isGrappleAtk;

    const atkResult = `${atkRoll.isCritical ? 'c' : 'm'}${atkRoll.isSuccess ? 's' : 'f'}`;
    const defResult = `${csRoll.isCritical ? 'c' : 'm'}${csRoll.isSuccess ? 's' : 'f'}`;
    const combatResult = meleeCombatResult(
        atkResult,
        defResult,
        isGrappleDef ? 'grapple' : 'counterstrike',
        atkImpactMod,
        csDialogResult.impactMod,
        isGrappleAtk,
        isGrappleDef
    );

    // We now know the results of the attack, roll applicable damage
    let atkImpactRoll = null;
    if (combatResult.outcome.atkDice) {
        atkImpactRoll = await new Roll(`${combatResult.outcome.atkDice}d6`).evaluate();
    }

    let csImpactRoll = null;
    if (combatResult.outcome.defDice) {
        csImpactRoll = await new Roll(`${combatResult.outcome.defDice}d6`).evaluate();
    }

    const atkChatData = {
        title: `Attack Result`,
        attacker: atkToken.name,
        atkTokenId: atkToken.id,
        defender: defToken.name,
        defTokenId: defToken.id,
        attackWeapon: atkWeaponName,
        mlType: 'AML',
        defense: 'Counterstrike',
        effAML: atkEffAML,
        effDML: 0,
        attackRoll: atkRoll.rollObj.total,
        atkIsCritical: atkRoll.isCritical,
        atkIsSuccess: atkRoll.isSuccess,
        atkRollResult: atkRoll.description,
        defenseRoll: 0,
        defRollResult: '',
        resultDesc: combatResult.desc,
        hasAttackHit: isGrappleAtk ? false : !!combatResult.outcome.atkDice,
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        weaponImpact: atkImpactMod,
        impactRoll: atkImpactRoll ? atkImpactRoll.dice[0].values.join(' + ') : null,
        totalImpact: atkImpactRoll ? atkImpactRoll.total + parseInt(atkImpactMod) : 0,
        atkAim: atkAim,
        atkAspect: atkAspect,
        isAtkStumbleRoll: combatResult.outcome.atkStumble,
        isAtkFumbleRoll: combatResult.outcome.atkFumble,
        isDefStumbleRoll: null,
        isDefFumbleRoll: null,
        visibleAtkActorId: atkToken.actor.id,
        visibleDefActorId: defToken.actor.id
    };

    const csChatData = {
        title: `Counterstrike Result`,
        attacker: defToken.name,
        atkTokenId: defToken.id,
        defender: atkToken.name,
        defTokenId: atkToken.id,
        outnumbered: defToken.actor?.system?.eph?.outnumbered > 1 ? defToken.actor.system.eph.outnumbered : 0,
        atkProne: atkToken.hasCondition(Condition.PRONE),
        defProne: defToken.hasCondition(Condition.PRONE),
        attackWeapon: csDialogResult.weapon.name,
        mlType: 'AML',
        addlModifierAbs: Math.abs(csDialogResult.addlModifier),
        addlModifierSign: csDialogResult.addlModifier < 0 ? '-' : '+',
        origEML: csEffEML,
        effEML: csEffEML + csDialogResult.addlModifier,
        effAML: csEffEML + csDialogResult.addlModifier,
        effDML: 0,
        attackRoll: csRoll.rollObj.total,
        atkIsCritical: csRoll.isCritical,
        atkIsSuccess: csRoll.isSuccess,
        atkRollResult: csRoll.description,
        defenseRoll: 0,
        defRollResult: '',
        resultDesc: combatResult.csDesc,
        hasAttackHit: isGrappleAtk ? false : !!combatResult.outcome.defDice,
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        weaponImpact: csDialogResult.impactMod,
        impactRoll: csImpactRoll ? csImpactRoll.dice[0].values.join(' + ') : null,
        totalImpact: csImpactRoll ? csImpactRoll.total + parseInt(csDialogResult.impactMod) : 0,
        atkAim: csDialogResult.aim,
        atkAspect: csDialogResult.aspect,
        dta: combatResult.outcome.dta,
        isAtkStumbleRoll: combatResult.outcome.defStumble,
        isAtkFumbleRoll: combatResult.outcome.defFumble,
        isDefStumbleRoll: null,
        isDefFumbleRoll: null,
        visibleAtkActorId: defToken.actor.id,
        visibleDefActorId: atkToken.actor.id
    };

    let chatTemplate = 'systems/hm3/templates/chat/attack-result-card.html';

    /*-----------------------------------------------------
     *    Attack Chat
     *----------------------------------------------------*/
    let html = await renderTemplate(chatTemplate, atkChatData);

    let messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim()
    };
    if (combatResult.outcome.atkDice) {
        messageData.type = CONST.CHAT_MESSAGE_STYLES.ROLL;
        messageData.sound = CONFIG.sounds.dice;
        messageData.roll = atkImpactRoll;
    } else {
        messageData.type = CONST.CHAT_MESSAGE_STYLES.OTHER;
    }

    const messageOptions = {};

    // Create a chat message
    await ChatMessage.create(messageData, messageOptions);

    /*-----------------------------------------------------
     *    Counterstrike Chat
     *----------------------------------------------------*/
    html = await renderTemplate(chatTemplate, csChatData);

    messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim()
    };
    if (combatResult.outcome.defDice) {
        messageData.type = CONST.CHAT_MESSAGE_STYLES.ROLL;
        messageData.sound = CONFIG.sounds.dice;
        messageData.roll = csImpactRoll;
    } else {
        messageData.type = CONST.CHAT_MESSAGE_STYLES.OTHER;
    }

    // Create a chat message
    await ChatMessage.create(messageData, messageOptions);

    if (combatResult.outcome.atkHold) {
        await defToken.addCondition(Condition.GRAPPLED);
    }
    if (combatResult.outcome.defHold) {
        await atkToken.addCondition(Condition.GRAPPLED);
    }

    return {atk: atkChatData, cs: csChatData};
}

/**
 * Resume the attack with the defender performing the "Dodge" defense.
 *
 * @param {*} atkToken Token representing the attacker
 * @param {*} defToken Token representing the defender
 * @param {*} type Type of attack: "melee" or "missile"
 * @param {*} weaponName Name of the weapon the attacker is using
 * @param {*} effAML The effective AML (Attack Mastery Level) of the attacker after modifiers applied
 * @param {*} aim Attack aim ("High", "Mid", "Low")
 * @param {*} aspect Weapon aspect ("Blunt", "Edged", "Piercing")
 * @param {*} impactMod Additional modifier to impact
 */
export async function dodgeResume(atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk) {
    if (!isValidToken(atkToken) || !isValidToken(defToken)) return null;
    if (!defToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${attackToken.name}`);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: atkToken.document});

    const atkRoll = await DiceHM3.rollTest({
        data: {},
        diceSides: 100,
        diceNum: 1,
        modifier: 0,
        target: effAML
    });

    const effDML = defToken.actor.system.dodge;

    let defaultModifier = 0;
    if (defToken.actor?.system?.eph?.outnumbered > 1) {
        defaultModifier += Math.floor((defToken.actor.system.eph.outnumbered - 1) * -10);
    }

    // A character who is attacking (or being attacked by) a prone enemy increases EML by 20. (COMBAT 11)
    const prone = atkToken.hasCondition(Condition.PRONE);
    if (prone) {
        defaultModifier += 20;
    }

    const defRoll = await DiceHM3.rollTest({
        data: {},
        diceSides: 100,
        diceNum: 1,
        modifier: defaultModifier,
        target: effDML
    });

    if (game.dice3d) {
        const aRoll = atkRoll.rollObj;
        aRoll.dice[0].options.colorset = 'glitterparty';
        await game.dice3d.showForRoll(aRoll, game.user, true);

        const dRoll = defRoll.rollObj;
        dRoll.dice[0].options.colorset = 'bloodmoon';
        await game.dice3d.showForRoll(dRoll, game.user, true);
    }

    const atkResult = `${atkRoll.isCritical ? 'c' : 'm'}${atkRoll.isSuccess ? 's' : 'f'}`;
    const defResult = `${defRoll.isCritical ? 'c' : 'm'}${defRoll.isSuccess ? 's' : 'f'}`;
    let combatResult = null;
    if (type === 'melee') {
        combatResult = meleeCombatResult(atkResult, defResult, 'dodge', impactMod, 0, isGrappleAtk);
    } else {
        combatResult = missileCombatResult(atkResult, defResult, 'dodge', impactMod);
    }

    let atkImpactRoll = null;
    if (combatResult.outcome.atkDice) {
        atkImpactRoll = await new Roll(`${combatResult.outcome.atkDice}d6`).evaluate();
    }

    const title = isGrappleAtk ? 'Grapple Result' : 'Attack Result';
    const chatData = {
        addlModifierAbs: Math.abs(defaultModifier),
        addlModifierSign: defaultModifier < 0 ? '-' : '+',
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        atkAim: aim,
        atkAspect: aspect,
        atkIsCritical: atkRoll.isCritical,
        atkIsSuccess: atkRoll.isSuccess,
        atkProne: atkToken.hasCondition(Condition.PRONE),
        atkRollResult: atkRoll.description,
        atkTokenId: atkToken.id,
        attacker: atkToken.name,
        attackRoll: atkRoll.rollObj.total,
        attackWeapon: weaponName,
        defender: defToken.name,
        defense: 'Dodge',
        defenseRoll: defRoll.rollObj.total,
        defIsCritical: defRoll.isCritical,
        defIsSuccess: defRoll.isSuccess,
        defProne: defToken.hasCondition(Condition.PRONE),
        defRollResult: defRoll.description,
        defTokenId: defToken.id,
        dta: combatResult.outcome.dta,
        effAML: effAML,
        effDML: effDML + defaultModifier,
        effEML: effDML + defaultModifier,
        hasAttackHit: isGrappleAtk ? false : !!combatResult.outcome.atkDice,
        impactRoll: atkImpactRoll ? atkImpactRoll.dice[0].values.join(' + ') : null,
        isAtkFumbleRoll: combatResult.outcome.atkFumble,
        isAtkHold: combatResult.outcome.atkHold,
        isAtkStumbleRoll: combatResult.outcome.atkStumble,
        isDefFumbleRoll: combatResult.outcome.defFumble,
        isDefHold: combatResult.outcome.defHold,
        isDefStumbleRoll: combatResult.outcome.defStumble,
        isGrappleAtk,
        isGrappleAtkSuccessful: isGrappleAtk && combatResult.outcome.atkDice > 0,
        mlType: 'DML',
        origEML: effDML,
        outnumbered: defToken.actor?.system?.eph?.outnumbered > 1 ? defToken.actor.system.eph.outnumbered : null,
        resultDesc: combatResult.desc,
        title,
        totalImpact: atkImpactRoll ? atkImpactRoll.total + parseInt(impactMod) : 0,
        visibleAtkActorId: atkToken.actor.id,
        visibleDefActorId: defToken.actor.id,
        weaponImpact: impactMod
    };

    let chatTemplate = 'systems/hm3/templates/chat/attack-result-card.html';

    const html = await renderTemplate(chatTemplate, chatData);

    let messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim()
    };
    if (combatResult.outcome.atkDice) {
        messageData.type = CONST.CHAT_MESSAGE_STYLES.ROLL;
        messageData.sound = CONFIG.sounds.dice;
        messageData.roll = atkImpactRoll;
    } else {
        messageData.type = CONST.CHAT_MESSAGE_STYLES.OTHER;
    }

    const messageOptions = {};

    // Create a chat message
    await ChatMessage.create(messageData, messageOptions);
    if (!combatResult.outcome.atkDice && game.settings.get('hm3', 'combatAudio')) {
        foundry.audio.AudioHelper.play({src: 'systems/hm3/audio/swoosh1.ogg', autoplay: true, loop: false}, true);
    }

    if (combatResult.outcome.atkHold) {
        await defToken.addCondition(Condition.GRAPPLED);
    }
    if (combatResult.outcome.defHold) {
        await atkToken.addCondition(Condition.GRAPPLED);
    }

    return chatData;
}

/**
 * Resume the attack with the defender performing the "Block" defense.
 *
 * @param {*} atkToken Token representing the attacker
 * @param {*} defToken Token representing the defender
 * @param {*} type Type of attack: "melee" or "missile"
 * @param {*} weaponName Name of the weapon the attacker is using
 * @param {*} effAML The effective AML (Attack Mastery Level) of the attacker after modifiers applied
 * @param {*} aim Attack aim ("High", "Mid", "Low")
 * @param {*} aspect Weapon aspect ("Blunt", "Edged", "Piercing")
 * @param {*} impactMod Additional modifier to impact
 */
export async function blockResume(atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk) {
    if (!isValidToken(atkToken) || !isValidToken(defToken)) return null;
    if (!defToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${attackToken.name}`);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: atkToken.document});

    const atkRoll = await DiceHM3.rollTest({
        data: {},
        diceSides: 100,
        diceNum: 1,
        modifier: 0,
        target: effAML
    });

    let prompt = null;

    // setup defensive available weapons.  This is all equipped melee weapons initially,
    // but later we may limit it to only shields.
    let defAvailWeapons = defToken.actor.itemTypes.weapongear;
    const shields = defAvailWeapons.filter((w) => w.system.isEquipped && /shield|\bbuckler\b/i.test(w.name));

    let atkWeapon = null;
    // Missile Pre-processing.  If attacker is using a high-velocity weapon, then defender
    // can only block with a shield.  If attacker is using a low-velocity weapon, then defender
    // can either block with a shield (at full DML) or with a melee weapon (at 1/2 DML).
    if (type === 'missile') {
        atkWeapon = atkToken.actor.itemTypes.missilegear.find((w) => w.name === weaponName);
        const highVelocityMissile = /\bbow\b|shortbow|longbow|crossbow|\bsling\b|\barrow\b|\bbolt\b|\bbullet\b/i.test(weaponName);

        if (highVelocityMissile) {
            if (!shields.length) {
                ui.notifications.warn(
                    `${weaponName} is a high-velocity missile that can only be blocked with a shield, and you don't have a shield equipped. Block defense refused.`
                );
                return null;
            } else {
                defAvailWeapons = shields;
                prompt = `${weaponName} is a high-velocity missile, and can only be blocked with a shield. Choose which shield to use.`;
            }
        } else {
            prompt = `${weaponName} is a low-velocity missile, and can be blocked either by a shield (at full DML) or by a melee weapon (at &#189; DML). Choose wisely.`;
        }
    } else {
        atkWeapon = atkToken.actor.itemTypes.weapongear.find((w) => w.name === weaponName);
    }

    // pop up dialog asking for which weapon to use for blocking
    // Only melee weapons can be used for blocking
    // Default weapon is one with highest DML
    let weapons = [];
    let defaultWeapon = null;
    let maxDML = -9999;
    defAvailWeapons.forEach((w) => {
        if (w.system.isEquipped) {
            if (w.system.defenseMasteryLevel > maxDML) {
                defaultWeapon = w;
            }
            weapons.push(w);
        }
    });

    if (weapons.length === 0) {
        return ui.notifications.warn(`${defToken.name} has no weapons that can be used for blocking, block defense refused.`);
    }

    let defaultModifier = 0;
    if (defToken.actor?.system?.eph?.outnumbered > 1) {
        defaultModifier += Math.floor(defToken.actor.system.eph.outnumbered - 1) * -10;
    }

    // A character who is attacking (or being attacked by) a prone enemy increases EML by 20. (COMBAT 11)
    const prone = atkToken.hasCondition(Condition.PRONE);
    if (prone) {
        defaultModifier += 20;
    }

    const options = {
        name: defToken.name,
        prompt: prompt,
        weapons: weapons,
        defaultWeapon: defaultWeapon,
        defaultModifier: defaultModifier,
        modifierType: 'Defense'
    };
    const dialogResult = await selectWeaponDialog(options);

    if (!dialogResult) return null;

    let effDML;
    const defWeapon = defToken.actor.itemTypes.weapongear.find((w) => w.name === dialogResult.weapon);
    if (defWeapon) {
        effDML = defWeapon.system.defenseMasteryLevel;
    } else {
        effDML = 5;
    }

    // If attacking weapon is a missile and defending weapon is not
    // a sheild, then it will defend at 1/2 DML.
    if (type === 'missile') {
        if (!shields.some((s) => s.name === dialogResult.weapon.name)) {
            effDML = Math.max(Math.round(effDML / 2), 5);
        }
    }

    const defRoll = await DiceHM3.rollTest({
        data: {},
        diceSides: 100,
        diceNum: 1,
        modifier: dialogResult.addlModifier,
        target: effDML
    });

    if (game.dice3d) {
        const aRoll = atkRoll.rollObj;
        aRoll.dice[0].options.colorset = 'glitterparty';
        await game.dice3d.showForRoll(aRoll, game.user, true);

        const dRoll = defRoll.rollObj;
        dRoll.dice[0].options.colorset = 'bloodmoon';
        await game.dice3d.showForRoll(dRoll, game.user, true);
    }

    const atkResult = `${atkRoll.isCritical ? 'c' : 'm'}${atkRoll.isSuccess ? 's' : 'f'}`;
    const defResult = `${defRoll.isCritical ? 'c' : 'm'}${defRoll.isSuccess ? 's' : 'f'}`;

    let combatResult;
    if (type === 'melee') {
        combatResult = meleeCombatResult(atkResult, defResult, 'block', impactMod, 0, isGrappleAtk);
    } else {
        combatResult = missileCombatResult(atkResult, defResult, 'block', impactMod);
    }

    let atkImpactRoll = null;
    if (combatResult.outcome.atkDice) {
        atkImpactRoll = await new Roll(`${combatResult.outcome.atkDice}d6`).evaluate();
    }

    // If there was a block, check whether a weapon broke
    let weaponBroke = {attackWeaponBroke: false, defendWeaponBroke: false};
    if (game.settings.get('hm3', 'weaponDamage') && combatResult.outcome.block) {
        weaponBroke = await checkWeaponBreak(atkWeapon, defWeapon);

        // If either of the weapons has broken, then mark the appropriate
        // weapon as "unequipped"

        if (weaponBroke.attackWeaponBroke) {
            const item = atkToken.actor.items.get(atkWeapon.id);
            await item.update({'system.isEquipped': false});
        }

        if (weaponBroke.defendWeaponBroke) {
            const item = defToken.actor.items.get(defWeapon.id);
            await item.update({'system.isEquipped': false});
        }
    }

    const title = isGrappleAtk ? 'Grapple Result' : 'Attack Result';
    const chatData = {
        addlModifierAbs: Math.abs(dialogResult.addlModifier),
        addlModifierSign: dialogResult.addlModifier < 0 ? '-' : '+',
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        atkAim: aim,
        atkAspect: aspect,
        atkIsCritical: atkRoll.isCritical,
        atkIsSuccess: atkRoll.isSuccess,
        atkProne: atkToken.hasCondition(Condition.PRONE),
        atkRollResult: atkRoll.description,
        atkTokenId: atkToken.id,
        atkWeaponBroke: weaponBroke.attackWeaponBroke,
        attacker: atkToken.name,
        attackRoll: atkRoll.rollObj.total,
        attackWeapon: weaponName,
        defender: defToken.name,
        defendWeapon: defWeapon ? defWeapon.name : '',
        defense: `Block w/ ${dialogResult.weapon}`,
        defenseRoll: defRoll.rollObj.total,
        defIsCritical: defRoll.isCritical,
        defIsSuccess: defRoll.isSuccess,
        defProne: defToken.hasCondition(Condition.PRONE),
        defRollResult: defRoll.description,
        defTokenId: defToken.id,
        defWeaponBroke: weaponBroke.defendWeaponBroke,
        dta: combatResult.outcome.dta,
        effAML: effAML,
        effDML: effDML + dialogResult.addlModifier,
        effEML: effDML + dialogResult.addlModifier,
        hasAttackHit: isGrappleAtk ? false : !!combatResult.outcome.atkDice,
        impactRoll: atkImpactRoll ? atkImpactRoll.dice[0].values.join(' + ') : null,
        isAtkFumbleRoll: combatResult.outcome.atkFumble,
        isAtkStumbleRoll: combatResult.outcome.atkStumble,
        isDefFumbleRoll: combatResult.outcome.defFumble,
        isDefStumbleRoll: combatResult.outcome.defStumble,
        isGrappleAtk,
        isGrappleAtkSuccessful: isGrappleAtk && combatResult.outcome.atkDice > 0,
        mlType: 'DML',
        origEML: effDML,
        outnumbered: defToken.actor?.system?.eph?.outnumbered > 1 ? defToken.actor.system.eph.outnumbered : null,
        resultDesc: combatResult.desc,
        title,
        totalImpact: atkImpactRoll ? atkImpactRoll.total + parseInt(impactMod) : 0,
        visibleAtkActorId: atkToken.actor.id,
        visibleDefActorId: defToken.actor.id,
        weaponImpact: impactMod
    };

    let chatTemplate = 'systems/hm3/templates/chat/attack-result-card.html';

    const html = await renderTemplate(chatTemplate, chatData);

    let messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim()
    };
    if (combatResult.outcome.atkDice) {
        messageData.type = CONST.CHAT_MESSAGE_STYLES.ROLL;
        messageData.sound = CONFIG.sounds.dice;
        messageData.roll = atkImpactRoll;
    } else {
        messageData.type = CONST.CHAT_MESSAGE_STYLES.OTHER;
    }

    const messageOptions = {};

    // Create a chat message
    await ChatMessage.create(messageData, messageOptions);
    if (!combatResult.outcome.atkDice && game.settings.get('hm3', 'combatAudio')) {
        foundry.audio.AudioHelper.play({src: 'systems/hm3/audio/shield-bash.ogg', autoplay: true, loop: false}, true);
    }

    if (combatResult.outcome.atkHold) {
        await defToken.addCondition(Condition.GRAPPLED);
    }
    if (combatResult.outcome.defHold) {
        await atkToken.addCondition(Condition.GRAPPLED);
    }

    return chatData;
}

export async function checkWeaponBreak(atkWeapon, defWeapon) {
    const atkToken = atkWeapon?.parent?.token;
    const defToken = defWeapon?.parent?.token;

    if (!atkWeapon || !atkToken) {
        console.error(`Attack weapon was not specified`);
        return {attackWeaponBroke: false, defendWeaponBroke: false};
    }

    if (!defWeapon || !defToken) {
        console.error(`Defend weapon was not specified`);
        return {attackWeaponBroke: false, defendWeaponBroke: false};
    }

    // Weapon Break Check
    let atkWeaponBroke = false;
    let defWeaponBroke = false;

    const atkWeaponQuality = atkWeapon.system.weaponQuality;
    const defWeaponQuality = defWeapon.system.weaponQuality;

    const atkBreakRoll = await new Roll('3d6').evaluate();
    const defBreakRoll = await new Roll('3d6').evaluate();

    if (atkWeaponQuality <= defWeaponQuality) {
        // Check attacker first, then defender
        atkWeaponBroke = atkBreakRoll.total > atkWeaponQuality;
        defWeaponBroke = !atkWeaponBroke && defBreakRoll.total > defWeaponQuality;
    } else {
        // Check defender first, then attacker
        defWeaponBroke = defBreakRoll.total > defWeaponQuality;
        atkWeaponBroke = !defWeaponBroke && atkBreakRoll.total > atkWeaponQuality;
    }

    const chatData = {};

    const messageData = {
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_STYLES.ROLL,
        sound: CONFIG.sounds.dice
    };

    const chatTemplate = 'systems/hm3/templates/chat/weapon-break-card.html';

    // Prepare and generate Attack Weapon Break chat message

    chatData.tokenName = atkToken.name;
    chatData.weaponName = atkWeapon.name;
    chatData.weaponQuality = atkWeapon.system.weaponQuality;
    chatData.weaponBroke = atkWeaponBroke;
    chatData.rollValue = atkBreakRoll.total;
    chatData.actorId = atkWeapon.parent;
    chatData.title = 'Attack Weapon Break Check';

    let html = await renderTemplate(chatTemplate, chatData);

    messageData.content = html.trim();
    messageData.speaker = ChatMessage.getSpeaker({token: defToken.document});
    messageData.roll = atkBreakRoll;

    const messageOptions = {};

    await ChatMessage.create(messageData, messageOptions);

    // Prepare and generate Defend Weapon Break chat message

    chatData.tokenName = defToken.name;
    chatData.weaponName = defWeapon.name;
    chatData.weaponQuality = defWeapon.system.weaponQuality;
    chatData.weaponBroke = defWeaponBroke;
    chatData.rollValue = defBreakRoll.total;
    chatData.actorId = defWeapon.parent;
    chatData.title = 'Defend Weapon Break Check';

    html = await renderTemplate(chatTemplate, chatData);

    messageData.content = html.trim();
    messageData.speaker = ChatMessage.getSpeaker({token: defToken.document});
    messageData.roll = defBreakRoll;

    await ChatMessage.create(messageData, messageOptions);

    return {attackWeaponBroke: atkWeaponBroke, defendWeaponBroke: defWeaponBroke};
}

/**
 * Resume the attack with the defender performing the "Ignore" defense.
 *
 * @param {*} atkToken Token representing the attacker
 * @param {*} defToken Token representing the defender
 * @param {*} type Type of attack: "melee" or "missile"
 * @param {*} weaponName Name of the weapon the attacker is using
 * @param {*} effAML The effective AML (Attack Mastery Level) of the attacker after modifiers applied
 * @param {*} aim Attack aim ("High", "Mid", "Low")
 * @param {*} aspect Weapon aspect ("Blunt", "Edged", "Piercing")
 * @param {*} impactMod Additional modifier to impact
 */
export async function ignoreResume(atkToken, defToken, type, weaponName, effAML, aim, aspect, impactMod, isGrappleAtk) {
    if (!isValidToken(atkToken) || !isValidToken(defToken)) return null;
    if (!defToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${attackToken.name}`);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: atkToken.document});

    const atkRoll = await DiceHM3.rollTest({
        data: {},
        diceSides: 100,
        diceNum: 1,
        modifier: 0,
        target: effAML
    });

    const effDML = 0;

    if (game.dice3d) {
        const aRoll = atkRoll.rollObj;
        aRoll.dice[0].options.colorset = 'glitterparty';
        await game.dice3d.showForRoll(aRoll, game.user, true);
    }

    const atkResult = `${atkRoll.isCritical ? 'c' : 'm'}${atkRoll.isSuccess ? 's' : 'f'}`;
    let combatResult;
    if (type === 'melee') {
        combatResult = meleeCombatResult(atkResult, null, 'ignore', impactMod, 0, isGrappleAtk);
    } else {
        combatResult = missileCombatResult(atkResult, null, 'ignore', impactMod);
    }

    let atkImpactRoll = null;
    if (combatResult.outcome.atkDice) {
        atkImpactRoll = await new Roll(`${combatResult.outcome.atkDice}d6`).evaluate();
    }

    const title = isGrappleAtk ? 'Grapple Result' : 'Attack Result';
    const chatData = {
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        atkAim: aim,
        atkAspect: aspect,
        atkDice: combatResult.outcome.atkDice,
        atkIsCritical: atkRoll.isCritical,
        atkIsSuccess: atkRoll.isSuccess,
        atkRollResult: atkRoll.description,
        atkTokenId: atkToken.id,
        attacker: atkToken.name,
        attackRoll: atkRoll.rollObj.total,
        attackWeapon: weaponName,
        defDice: combatResult.outcome.defDice,
        defender: defToken.name,
        defense: 'Ignore',
        defenseRoll: 0,
        defRollResult: '',
        defTokenId: defToken.id,
        dta: combatResult.outcome.dta,
        effAML: effAML,
        effDML: 0,
        hasAttackHit: isGrappleAtk ? false : !!combatResult.outcome.atkDice,
        impactRoll: atkImpactRoll ? atkImpactRoll.dice[0].values.join(' + ') : null,
        isAtkFumbleRoll: combatResult.outcome.atkFumble,
        isAtkHold: combatResult.outcome.atkHold,
        isAtkStumbleRoll: combatResult.outcome.atkStumble,
        isDefFumbleRoll: combatResult.outcome.defFumble,
        isDefHold: combatResult.outcome.defHold,
        isDefStumbleRoll: combatResult.outcome.defStumble,
        isGrappleAtk,
        isGrappleAtkSuccessful: isGrappleAtk && combatResult.outcome.atkDice > 0,
        mlType: 'AML',
        resultDesc: combatResult.desc,
        title,
        totalImpact: atkImpactRoll ? atkImpactRoll.total + parseInt(impactMod) : 0,
        visibleAtkActorId: atkToken.actor.id,
        visibleDefActorId: defToken.actor.id,
        weaponImpact: impactMod
    };

    let chatTemplate = 'systems/hm3/templates/chat/attack-result-card.html';

    const html = await renderTemplate(chatTemplate, chatData);

    let messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim()
    };
    if (combatResult.outcome.atkDice) {
        messageData.type = CONST.CHAT_MESSAGE_STYLES.ROLL;
        messageData.sound = CONFIG.sounds.dice;
        messageData.roll = atkImpactRoll;
    } else {
        messageData.type = CONST.CHAT_MESSAGE_STYLES.OTHER;
    }

    const messageOptions = {};

    // Create a chat message
    await ChatMessage.create(messageData, messageOptions);

    if (combatResult.outcome.atkHold) {
        await defToken.addCondition(Condition.GRAPPLED);
    }
    if (combatResult.outcome.defHold) {
        await atkToken.addCondition(Condition.GRAPPLED);
    }

    return chatData;
}

/**
 * Display the results of meele combat.
 *
 * @param {String} atkResult The result from the attack, comprised of "cs", "cf", "ms", or "mf"
 * @param {String} defResult The result from the defense, comprised of "cs", "cf", "ms", or "mf"
 * @param {String} defense The type of defense: "ignore", "block", "counterstrike", or "dodge"
 * @param {Number} [atkAddlImpact=0] Additional impact for the attacker
 * @param {Number} [defAddlImpact=0] If counterstrike defense, the additional impact for the defender (counterstriker)
 * @param {boolean} [isGrappleAtk=false]
 * @param {boolean} [isGrappleDef=false]
 */
export function meleeCombatResult(atkResult, defResult, defense, atkAddlImpact = 0, defAddlImpact = 0, isGrappleAtk = false, isGrappleDef = false) {
    let outcome = null;
    let index = null;
    const defenseTable = isGrappleAtk ? HM3.grappleCombatTable[defense] : HM3.meleeCombatTable[defense];
    if (defenseTable) {
        if (defense === 'ignore') {
            index = atkResult;
        } else {
            index = `${atkResult}:${defResult}`;
        }
        outcome = defenseTable[index];
    }

    if (!outcome) return null;

    const result = {
        outcome: outcome,
        desc: isGrappleAtk ? 'Grapple attempt unsuccessful.' : 'Attack misses.',
        csDesc: isGrappleDef ? 'Grapple attempt unsuccessful.' : 'Counterstrike misses.',
        atkHold: !!outcome.atkHold,
        defHold: !!outcome.defHold
    };

    if (defense !== 'counterstrike') {
        if (outcome.atkHold) {
            result.desc = `Attacker obtains hold.`;
        } else if (outcome.atkDice) {
            result.desc = `Attacker strikes for ${diceFormula(outcome.atkDice, atkAddlImpact)} impact.`;
        } else if (outcome.atkFumble && outcome.defFumble) {
            result.desc = 'Both attacker and defender fumble.';
        } else if (outcome.atkFumble) {
            result.desc = `Attacker fumbles.`;
        } else if (outcome.defFumble) {
            result.desc = `Defender fumbles.`;
        } else if (outcome.defStumble && outcome.atkStumble) {
            result.desc = `Both attacker and defender stumble.`;
        } else if (outcome.atkStumble) {
            result.desc = `Attacker stumbles.`;
        } else if (outcome.defStumble) {
            result.desc = `Defender stumbles.`;
        } else if (outcome.block) {
            result.desc = `Attack blocked.`;
        } else if (outcome.dta) {
            result.desc = `Defender gains a Tactical Advantage.`;
        }
    } else {
        if (outcome.atkHold && outcome.defHold) {
            result.desc = `Both attacker and defender obtain hold.`;
        } else if (outcome.atkHold) {
            result.desc = `Attacker obtains hold.`;
        } else if (outcome.atkDice) {
            result.desc = `Attacker strikes for ${diceFormula(outcome.atkDice, atkAddlImpact)} impact.`;
        } else if (outcome.atkFumble) {
            result.desc = `Attacker fumbles.`;
        } else if (outcome.atkStumble) {
            result.desc = `Attacker stumbles.`;
        }

        if (outcome.atkHold && outcome.defHold) {
            result.desc = `Both attacker and defender obtain hold.`;
        } else if (outcome.defHold) {
            result.csDesc = `Defender obtains hold.`;
        } else if (outcome.defDice) {
            result.csDesc = `Counterstriker strikes for ${diceFormula(outcome.defDice, defAddlImpact)} impact.`;
        } else if (outcome.defFumble) {
            result.csDesc = 'Counterstriker fumbles.';
        } else if (outcome.defStumble) {
            result.csDesc = 'Counterstriker stumbles.';
        } else if (outcome.block) {
            result.desc = 'Attacker blocked.';
            result.csDesc = `Counterstriker blocked.`;
        } else if (outcome.dta) {
            result.csDesc = `Counterstriker gains a Tactical Advantage!`;
        } else if (outcome.miss) {
            result.csDesc = `Counterstrike misses.`;
        }
    }

    return result;
}

/**
 * Calculate and display the results of the missile combat.
 *
 * @param {String} atkResult The result from the attack, comprised of "cs", "cf", "ms", or "mf"
 * @param {String} defResult The result from the defense, comprised of "cs", "cf", "ms", or "mf"
 * @param {String} defense The type of defense: "ignore", "block", "counterstrike", or "dodge"
 * @param {Number} atkAddlImpact Any additional impact
 */
export function missileCombatResult(atkResult, defResult, defense, atkAddlImpact = 0) {
    let outcome = null;
    let index = null;
    const defenseTable = HM3.missileCombatTable[defense];
    if (defenseTable) {
        if (defense === 'ignore') {
            index = atkResult;
        } else {
            index = `${atkResult}:${defResult}`;
        }
        outcome = defenseTable[index];
    }

    if (!outcome) return null;

    const result = {outcome: outcome, desc: 'No result'};

    if (outcome.atkDice && !outcome.defDice) {
        result.desc = `Missile strikes for ${diceFormula(outcome.atkDice, atkAddlImpact)} impact.`;
    } else if (outcome.wild) {
        result.desc = `Missile goes wild; effects at GM discretion.`;
    } else if (outcome.block) {
        result.desc = `Defender blocks missile!`;
    } else if (outcome.miss) {
        result.desc = `Missile missed.`;
    }

    return result;
}

/**
 * Return the dice formula meeting the specified parameters
 *
 * @param {*} numDice  Number of 6-sided dice to include in the formula
 * @param {*} addlImpact Any additional impact to include in the formula
 */
function diceFormula(numDice, addlImpact) {
    if (numDice <= 0) {
        return 'no';
    }
    if (addlImpact) {
        return `${numDice}d6${addlImpact < 0 ? '-' : '+'}${Math.abs(addlImpact)}`;
    } else {
        return `${numDice}d6`;
    }
}

/**
 * Returns a structure specifying the default aspect for a weapon, as well as the
 * impact values for all other aspects.  The default aspect is always the aspect
 * with the greatest impact.
 *
 * @param {*} weapon Name of weapon
 * @param {*} items List of items containing 'weapongear' items.
 */
function calcWeaponAspect(weapon) {
    const data = weapon.system;

    // Note that although "Fire" is in this list, because it is a
    // type of damage, no normal weapon uses it as its aspect.
    // It is here so that it can be selected (no default impact
    // damage would be specified for that aspect).
    const result = {
        defaultAspect: null,
        aspects: {}
    };

    // Any impact < 0 indicates that aspect is not available
    const maxImpact = Math.max(data.blunt, data.piercing, data.edged);
    if (maxImpact >= 0) {
        if (data.blunt >= 0) result.aspects['Blunt'] = data.blunt;
        if (data.edged >= 0) result.aspects['Edged'] = data.edged;
        if (data.piercing >= 0) result.aspects['Piercing'] = data.piercing;
        if (maxImpact === data.piercing) {
            result.defaultAspect = 'Piercing';
        } else if (maxImpact === data.edged) {
            result.defaultAspect = 'Edged';
        } else if (maxImpact === data.blunt) {
            result.defaultAspect = 'Blunt';
        }
    }

    return result;
}

/**
 * Finds an Item by name or UUID. If name is provided, searches within the specified actor.
 *
 * @param {*} itemName Either an Item or a string formatted as a UUID
 * @param {*} type The type of Item (e.g., "missilegear")
 * @param {*} actor The actor containing the items to search
 */
export async function getItem(itemName, type, actor) {
    if (!itemName) {
        ui.notifications.warn('No item name was specified. You must specify an item name.');
        return null;
    }

    let item = await fromUuid(itemName);

    if (!item) {
        if (!actor || typeof actor !== 'object') {
            ui.notifications.warn('No actor was selected. You must select an actor.');
            return null;
        }

        const lcItemName = itemName.toLowerCase();
        const items = actor ? actor.items.filter((i) => i.type === type && i.name.toLowerCase() === lcItemName) : [];
        if (items.length > 1) {
            ui.notifications.warn(
                `Your controlled Actor ${actor.name} has more than one ${type} with name ${itemName}. The first matched ${type} will be chosen.`
            );
        } else if (items.length === 0) {
            ui.notifications.warn(`Your controlled Actor does not have a ${type} named ${itemName}`);
            return null;
        }
        item = items[0];
    }

    if (!item) {
        ui.notifications.warn(`The item ${itemName} was not found`);
        return null;
    }

    return item;
}

/**
 * Calculates the distance from sourceToken to targetToken in "scene" units (e.g., feet).
 *
 * @param {Token} sourceToken
 * @param {Token} targetToken
 * @param {Boolean} gridUnits If true, return in grid units, not "scene" units
 */
export function rangeToTarget(sourceToken, targetToken, gridUnits = false) {
    if (!sourceToken || !targetToken || !canvas.scene || !canvas.scene.grid) return 9999;

    // If the current scene is marked "Theatre of the Mind", then range is always 0
    if (canvas.scene.getFlag('hm3', 'isTotm')) return 0;

    const sToken = canvas.tokens.get(sourceToken.id);
    const tToken = canvas.tokens.get(targetToken.id);

    const segments = [];
    const source = sToken.center;
    const dest = tToken.center;
    const ray = new Ray(source, dest);
    segments.push({ray});
    const distances = canvas.grid.measureDistances(segments, {gridSpaces: true});
    const distance = distances[0];
    console.log(`Distance = ${distance}, gridUnits=${gridUnits}`);
    if (gridUnits) return Math.round(distance / canvas.dimensions.distance);
    return distance;
}

/**
 * Optionally hide the display of chat card action buttons which cannot be performed by the user
 */
export const displayChatActionButtons = function (message, html, data) {
    const chatCard = html.find('.hm3.chat-card');
    if (chatCard.length > 0) {
        // If the user is the GM, proceed
        if (game.user.isGM) return;

        // Otherwise conceal action buttons
        const buttons = chatCard.find('button[data-action]');
        buttons.each((i, btn) => {
            const actor = btn.dataset.visibleActorId ? game.actors.get(btn.dataset.visibleActorId) : null;
            if (!actor || !actor.isOwner) {
                btn.style.display = 'none';
            }
        });
    }
};
