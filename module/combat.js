import {HM3} from './config.js';
import {DiceHM3} from './hm3-dice.js';
import {TokenDocumentHM3, TokenHM3} from './hm3-token.js';
import {ActorType, ArcanePower, Aspect, Condition, ItemType} from './hm3-types.js';
import {truncate} from './utility.js';

/**
 * Initiates a missile attack.
 *
 * Displays a missile attack dialog asking for attributes of the attack (aim location,
 * special modifiers, etc.) and generates a missile attack chat message that includes
 * buttons for selecting the appropriate defense.
 *
 * No die rolling occurs as a result of this function, only the declaration of the attack.
 *
 * @param atkToken {TokenHM3} Token representing attacker
 * @param defToken {TokenHM3} Token representing defender
 * @param missileItem {ItemHM3} Missile weapon used by attacker
 */
export async function missileAttack(atkToken, defToken, missileItem) {
    if (!atkToken) {
        ui.notifications.warn(`No attacker token identified.`);
        return null;
    }

    if (!isValidToken(atkToken)) {
        ui.notifications.error(`Attack token not valid.`);
        console.error(`HM3 | missileAttack atkToken=${atkToken} is not valid.`);
        return null;
    }

    if (!defToken) {
        ui.notifications.warn(`No defender token identified.`);
        return null;
    }

    if (!isValidToken(defToken)) {
        ui.notifications.error(`Defender token not valid.`);
        console.error(`HM3 | missileAttack defToken=${defToken} is not valid.`);
        return null;
    }

    if (!atkToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${atkToken.name}`);
        return null;
    }

    if (atkToken.hasCondition(Condition.BROKEN)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.BROKEN}'.`);
        return null;
    }

    if (atkToken.hasCondition(Condition.CAUTIOUS)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.CAUTIOUS}'.`);
        return null;
    }

    if (atkToken.hasCondition(Condition.SHOCKED)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.SHOCKED}'.`);
        return null;
    }

    if (atkToken.hasCondition(Condition.UNCONSCIOUS)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.UNCONSCIOUS}'.`);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: atkToken});
    const range = rangeToTarget(atkToken, defToken);

    const options = {
        distance: Math.round(range),
        type: 'Attack',
        attackerName: atkToken.name,
        defenderName: defToken.name
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

    if (atkToken.actor?.system?.eph?.missileAMLMod !== undefined) {
        options['defaultModifier'] = atkToken.actor.system.eph.missileAMLMod;
    }

    const dialogResult = await attackDialog(options);

    // If user cancelled the dialog, then return immediately
    if (!dialogResult) return null;

    if (!missileItem) {
        missileItem = dialogResult.weapon;
    }

    if (game.settings.get('hm3', 'missileTracking') && atkToken.actor) {
        if (missileItem.system.quantity <= 0) {
            ui.notifications.warn(`No more ${missileItem.name} left, attack denied.`);
            return null;
        }

        const item = atkToken.actor.items.get(missileItem.id);
        item.update({'system.quantity': missileItem.system.quantity - 1});
    }

    dialogResult.addlModifier += dialogResult.aim === 'Mid' ? 0 : -10;
    const effAML = game.hm3.macros.HM100Check(
        dialogResult.weapon.system.attackMasteryLevel + dialogResult.addlModifier + dialogResult.rangeMod
    );

    // Prepare for Chat Message
    const chatTemplate = 'systems/hm3/templates/chat/attack-card.hbs';
    const grappled = defToken.hasCondition(Condition.GRAPPLED);
    const incapacitated = defToken.hasCondition(Condition.INCAPACITATED);
    const shocked = defToken.hasCondition(Condition.SHOCKED);
    const stunned = defToken.hasCondition(Condition.STUNNED);
    const unconscious = defToken.hasCondition(Condition.UNCONSCIOUS);
    const atkIsHighVelocityMissile = /\bbow\b|shortbow|longbow|crossbow|\bsling\b|\barrow\b|\bbolt\b|\bbullet\b/i.test(
        missileItem.name
    );
    const defHasShields = defToken.actor.itemTypes.weapongear.filter(
        (w) => w.system.isEquipped && /shield|\bbuckler\b/i.test(w.name)
    );
    const noHighVelocityBlockAvailable = atkIsHighVelocityMissile && defHasShields.length === 0;

    const chatTemplateData = {
        title: `${missileItem.name} Missile Attack`,
        addlModifierAbs: Math.abs(dialogResult.addlModifier),
        addlModifierSign: dialogResult.addlModifier < 0 ? '-' : '+',
        aim: dialogResult.aim,
        aspect: dialogResult.aspect,
        atkTokenId: atkToken.id,
        attacker: atkToken.name,
        defender: defToken.name,
        defTokenId: defToken.id,
        effAML,
        hasBlock: !(grappled || incapacitated || shocked || stunned || unconscious) && !noHighVelocityBlockAvailable,
        hasCounterstrike: false, // not possible against missile attacks
        hasDodge: !(grappled || incapacitated || shocked || stunned || unconscious) && defToken.actor.system.dodge > 0,
        hasEsoteric: false,
        hasIgnore: true,
        impactMod: dialogResult.impactMod,
        origAML: missileItem.system.attackMasteryLevel,
        rangeDist: Math.round(range),
        rangeExceedsExtreme: dialogResult.rangeExceedsExtreme,
        rangeModifierAbs: Math.abs(dialogResult.rangeMod),
        rangeModSign: dialogResult.rangeMod < 0 ? '-' : '+',
        rangeText: dialogResult.range,
        visibleActorId: defToken.actor.id,
        weaponName: missileItem.name,
        weaponType: 'missile'
    };
    chatTemplateData.oneButton =
        [
            chatTemplateData.hasBlock,
            chatTemplateData.hasCounterstrike,
            chatTemplateData.hasDodge,
            chatTemplateData.hasEsoteric,
            chatTemplate.hasIgnore
        ].filter(Boolean).length === 1;

    const html = await renderTemplate(chatTemplate, chatTemplateData);

    const messageData = {
        content: html.trim(),
        speaker,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER,
        user: game.user.id
    };

    // Create a chat message
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    await ChatMessage.create(messageData, {});

    if (game.settings.get('hm3', 'combatAudio')) {
        foundry.audio.AudioHelper.play({src: 'sounds/drums.wav', autoplay: true, loop: false}, true);
    }

    if (game.settings.get('hm3', 'autoMarkUsedSkills')) {
        const skill = options.weapon.system.assocSkill;
        atkToken.actor.items.forEach((item) => {
            if (item.name === skill && item.type === 'skill') {
                item.update({'system.improveFlag': item.system.improveFlag + 1});
            }
        });
    }

    return chatTemplateData;
}

export async function esotericAttack(atkToken, defToken, esotericItem) {
    if (!atkToken) {
        ui.notifications.warn(`No attacker token identified.`);
        return null;
    }

    if (!isValidToken(atkToken)) {
        ui.notifications.error(`Attack token not valid.`);
        console.error(`HM3 | esotericAttack atkToken=${atkToken} is not valid.`);
        return null;
    }
    console.assert(atkToken instanceof TokenDocumentHM3, `atkToken is not a TokenHM3 instance: ${atkToken}`);

    if (!defToken) {
        ui.notifications.warn(`No defender token identified.`);
        return null;
    }

    if (!isValidToken(defToken)) {
        ui.notifications.error(`Defender token not valid.`);
        console.error(`HM3 | esotericAttack defToken=${defToken} is not valid.`);
        return null;
    }
    console.assert(defToken instanceof TokenHM3, `defToken is not a TokenHM3 instance: ${defToken}`);

    if (!atkToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${atkToken.name}`);
        return null;
    }

    if (atkToken.hasCondition(Condition.BROKEN)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.BROKEN}'.`);
        return null;
    }

    if (atkToken.hasCondition(Condition.CAUTIOUS)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.CAUTIOUS}'.`);
        return null;
    }

    if (atkToken.hasCondition(Condition.SHOCKED)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.SHOCKED}'.`);
        return null;
    }

    if (atkToken.hasCondition(Condition.UNCONSCIOUS)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.UNCONSCIOUS}'.`);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: atkToken});
    const distance = rangeToTarget(atkToken, defToken);

    const options = {
        attackerName: atkToken.name,
        defenderName: defToken.name,
        distance,
        maxDistance: esotericItem.system.masteryLevel,
        type: esotericItem.name,
        weapon: esotericItem
    };

    if (options.distance > options.maxDistance) {
        const msg = `Target ${defToken.name} is outside of ${esotericItem.name} range for attacker ${atkToken.name}; range=${distance}/${options.maxDistance}.`;
        ui.notifications.warn(msg);
        return null;
    }

    const dialogResult = await esotericAttackDialog(options);

    // If user cancelled the dialog, then return immediately
    if (!dialogResult) return null;

    const effAML = game.hm3.macros.HM100Check(esotericItem.system.effectiveMasteryLevel + dialogResult.addlModifier);

    // Prepare for Chat Message
    const chatTemplate = 'systems/hm3/templates/chat/attack-card.hbs';
    const chatTemplateData = {
        title: `Esoteric Attack`,
        addlInfo: dialogResult.addlInfo,
        addlModifierAbs: Math.abs(dialogResult.addlModifier),
        addlModifierSign: dialogResult.addlModifier < 0 ? '-' : '+',
        atkTokenId: atkToken.id,
        attacker: atkToken.name,
        defender: defToken.name,
        defTokenId: defToken.id,
        effAML,
        hasBlock: false,
        hasCounterstrike: false,
        hasDodge: false,
        hasEsoteric: true,
        hasIgnore: false,
        origAML: esotericItem.system.effectiveMasteryLevel,
        visibleActorId: defToken.actor.id,
        weaponName: esotericItem.name,
        weaponType: 'esoteric'
    };
    chatTemplateData.oneButton =
        [
            chatTemplateData.hasBlock,
            chatTemplateData.hasCounterstrike,
            chatTemplateData.hasDodge,
            chatTemplateData.hasEsoteric,
            chatTemplate.hasIgnore
        ].filter(Boolean).length === 1;

    const html = await renderTemplate(chatTemplate, chatTemplateData);

    const messageData = {
        content: html.trim(),
        speaker,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER,
        user: game.user.id
    };

    const messageOptions = {};

    // Create a chat message
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    await ChatMessage.create(messageData, messageOptions);

    if (game.settings.get('hm3', 'autoMarkUsedSkills')) {
        const skill = esotericItem;
        atkToken.actor.items.forEach((item) => {
            if (item.name === skill && item.type === 'skill') {
                item.update({'system.improveFlag': item.system.improveFlag + 1});
            }
        });
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
 * @param atkToken {TokenHM3} Token representing attacker
 * @param defToken {TokenHM3} Token representing defender
 * @param weaponItem {ItemHM3} Melee weapon used by attacker
 */
export async function meleeAttack(atkToken, defToken, {weaponItem = null, unarmed = false, noDialog = false} = {}) {
    if (!atkToken) {
        ui.notifications.warn(`No attacker token identified.`);
        return null;
    }

    if (!isValidToken(atkToken)) {
        console.error(`HM3 | meleeAttack atkToken=${atkToken} is not valid.`);
        return null;
    }

    if (!defToken) {
        ui.notifications.warn(`No defender token identified.`);
        return null;
    }

    if (!isValidToken(defToken)) {
        console.error(`HM3 | meleeAttack defToken=${defToken} is not valid.`);
        return null;
    }

    if (!atkToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${atkToken.name}`);
        return null;
    }

    if (atkToken.hasCondition(Condition.BROKEN)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.BROKEN}'.`);
        return null;
    }

    if (atkToken.hasCondition(Condition.CAUTIOUS)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.CAUTIOUS}'.`);
        return null;
    }

    if (atkToken.hasCondition(Condition.SHOCKED)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.SHOCKED}'.`);
        return null;
    }

    if (atkToken.hasCondition(Condition.UNCONSCIOUS)) {
        ui.notifications.warn(`You cannot attack while you are '${Condition.UNCONSCIOUS}'.`);
        return null;
    }

    const targetRange = rangeToTarget(atkToken, defToken, true);
    if (targetRange > 1) {
        const msg = `Target ${defToken.name} is outside of melee range for attacker ${atkToken.name}; range=${targetRange}.`;
        console.warn(msg);
        ui.notifications.warn(msg);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: atkToken});

    // display dialog, get aspect, aim, and addl damage
    const options = {
        type: 'Attack',
        attackerName: atkToken.name,
        defenderName: defToken.name,
        noDialog,
        unarmed
    };

    // If a weapon was provided, don't ask for it.
    if (weaponItem) {
        if (weaponItem.system.isEquipped) {
            options['weapon'] = weaponItem;
        } else {
            ui.notifications.warn(`For ${atkToken.name} ${weaponItem.name} is not equipped.`);
            return null;
        }
    } else {
        const defWpns = defaultMeleeWeapon(atkToken);
        if (!defWpns.weapons || !defWpns.weapons.length) {
            ui.notifications.warn(`${atkToken.name} does not have any equipped melee weapons.`);
            return null;
        }
        options['weapons'] = defWpns.weapons;
        options['defaultWeapon'] = defWpns.defaultWeapon;
    }

    options['defaultModifier'] = 0;
    if (atkToken.actor?.system?.eph?.meleeAMLMod !== undefined) {
        options['defaultModifier'] += atkToken.actor.system.eph.meleeAMLMod;
    }

    // A character who is attacking (or being attacked by) a prone enemy increases EML by 20. (COMBAT 11)
    const defProne = defToken.hasCondition(Condition.PRONE);
    if (defProne) {
        options['defaultModifier'] += 20;
    }

    const dialogResult = await attackDialog(options);

    // If user cancelled the dialog, then return immediately
    if (!dialogResult) return null;

    if (!weaponItem) {
        weaponItem = dialogResult.weapon;
    }

    dialogResult.addlModifier += dialogResult.aim === 'Mid' ? 0 : -10;

    const atkCloseMode =
        atkToken.hasCondition(Condition.CLOSE_MODE) &&
        !options.unarmed &&
        (dialogResult.aspect === 'Blunt' || dialogResult.aspect === 'Edged');
    dialogResult.addlModifier += atkCloseMode ? -10 : 0;

    const effAML = game.hm3.macros.HM100Check(
        dialogResult.weapon.system.attackMasteryLevel + dialogResult.addlModifier
    );

    // Prepare for Chat Message
    const chatTemplate = 'systems/hm3/templates/chat/attack-card.hbs';

    const defBerserk = defToken.hasCondition(Condition.BERSERK);
    const defBroken = defToken.hasCondition(Condition.BROKEN);
    const defCautious = defToken.hasCondition(Condition.CAUTIOUS);
    const defDesperate = defToken.hasCondition(Condition.DESPERATE);
    const defGrappled = defToken.hasCondition(Condition.GRAPPLED);
    const defIncapacitated = defToken.hasCondition(Condition.INCAPACITATED);
    const defShocked = defToken.hasCondition(Condition.SHOCKED);
    const defStunned = defToken.hasCondition(Condition.STUNNED);
    const defUnconscious = defToken.hasCondition(Condition.UNCONSCIOUS);

    const type = dialogResult.isGrappleAtk ? 'Grapple' : 'Melee';
    const chatTemplateData = {
        addlModifierAbs: Math.abs(dialogResult.addlModifier),
        addlModifierSign: dialogResult.addlModifier < 0 ? '-' : '+',
        aim: dialogResult.aim,
        aspect: dialogResult.aspect,
        atkBerserk: atkToken.hasCondition(Condition.BERSERK),
        atkCloseMode,
        atkProne: atkToken.hasCondition(Condition.PRONE),
        atkTokenId: atkToken.id,
        attacker: atkToken.name,
        defBerserk,
        defender: defToken.name,
        defProne,
        defTokenId: defToken.id,
        effAML,
        hasBlock:
            !(
                defBerserk ||
                defDesperate ||
                defGrappled ||
                defIncapacitated ||
                defShocked ||
                defStunned ||
                defUnconscious
            ) && !dialogResult.isGrappleAtk,
        hasCounterstrike: !(defBroken || defCautious || defIncapacitated || defShocked || defStunned || defUnconscious),
        hasDodge:
            !(
                defBerserk ||
                defDesperate ||
                defGrappled ||
                defIncapacitated ||
                defShocked ||
                defStunned ||
                defUnconscious
            ) && defToken.actor.system.dodge > 0,
        hasEsoteric: false,
        hasIgnore: true,
        impactMod: dialogResult.impactMod,
        isGrappleAtk: !!dialogResult.isGrappleAtk,
        origAML: weaponItem.system.attackMasteryLevel,
        title: `${weaponItem.name} ${type} Attack`,
        visibleActorId: defToken.actor.id,
        weaponName: weaponItem.name,
        weaponType: 'melee'
    };
    chatTemplateData.oneButton =
        [
            chatTemplateData.hasBlock,
            chatTemplateData.hasCounterstrike,
            chatTemplateData.hasDodge,
            chatTemplateData.hasEsoteric,
            chatTemplate.hasIgnore
        ].filter(Boolean).length === 1;

    const html = await renderTemplate(chatTemplate, chatTemplateData);

    const messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim(),
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
    };

    const messageOptions = {};

    // Create a chat message
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    await ChatMessage.create(messageData, messageOptions);

    if (game.settings.get('hm3', 'combatAudio')) {
        foundry.audio.AudioHelper.play({src: 'sounds/drums.wav', autoplay: true, loop: false}, true);
    }

    if (game.settings.get('hm3', 'autoMarkUsedSkills')) {
        const skill = options.weapon.system.assocSkill;
        atkToken.actor.items.forEach((item) => {
            if (item.name === skill && item.type === 'skill') {
                item.update({'system.improveFlag': item.system.improveFlag + 1});
            }
        });
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
    let queryWeaponDialog = 'systems/hm3/templates/dialog/query-weapon-dialog.hbs';

    const dialogOptions = {
        title: `${options.name} Select Weapon`
    };
    dialogOptions.weapons = options.weapons.map((w) => {
        return {
            key: w.name
        };
    });
    dialogOptions.defaultWeapon = options.defaultWeapon;
    dialogOptions.defaultModifier = options.defaultModifier || 0;
    if (options.modifierType) {
        dialogOptions.modifierType = options.modifierType;
    }
    dialogOptions.prompt = options.prompt ? options.prompt : 'Please select your weapon';

    const dlghtml = await renderTemplate(queryWeaponDialog, dialogOptions);

    if (!options.noDialog) {
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
    } else {
        // No dialog, just return the default weapon and modifier
        return {
            weapon: options.defaultWeapon.name,
            addlModifier: options.defaultModifier || 0
        };
    }
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
        }
    }

    if (!options.weapon) {
        ui.notifications.warn(`${options.attackerName} has no equipped weapons available for attack.`);
        return null;
    }

    // If an attack is carried out unarmed, you can select the GRAPPLE option.
    options.unarmed = options.weapon.system.assocSkill.toLowerCase().includes('unarmed');

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
        const shortDesc = `Short (${
            isGridDistanceUnits ? weaponData.range.short / dist + ' hex' : weaponData.range.short + ' ft'
        }/+0)`;
        const mediumDesc = `Medium (${
            isGridDistanceUnits ? weaponData.range.medium / dist + ' hex' : weaponData.range.medium + ' ft'
        }/-20)`;
        const longDesc = `Long (${
            isGridDistanceUnits ? weaponData.range.long / dist + ' hex' : weaponData.range.long + ' ft'
        }/-40)`;
        const extremeDesc = `Extreme (${
            isGridDistanceUnits ? weaponData.range.extreme / dist + ' hex' : weaponData.range.extreme + ' ft'
        }/-80)`;
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

    const attackDialogTemplate = 'systems/hm3/templates/dialog/attack-dialog.hbs';
    const dlghtml = await renderTemplate(attackDialogTemplate, dialogOptions);

    const evaluate = (form, formRange, isGrappleAtk) => {
        const result = {
            addlModifier: form.addlModifier ? parseInt(form.addlModifier.value) : 0,
            aim: form.aim ? form.aim.value : null,
            aspect: form.weaponAspect ? form.weaponAspect.value : null,
            impactMod: 0,
            isGrappleAtk,
            range: formRange,
            rangeExceedsExtreme: dialogOptions.rangeExceedsExtreme,
            unarmed: options.unarmed,
            weapon: options.weapon
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
    };

    if (!options.noDialog) {
        // Request weapon details
        return Dialog.prompt({
            title: dialogOptions.title,
            content: dlghtml.trim(),
            label: options.type,
            callback: (html) => {
                const form = html[0].querySelector('form');
                const formRange = form.range ? form.range.value : null;
                const isGrappleAtk = form[3]?.checked || false;

                return evaluate(form, formRange, isGrappleAtk);
            }
        });
    } else {
        return evaluate(
            {
                weaponAspect: {value: dialogOptions.defaultAspect},
                aim: {value: dialogOptions.defaultAim},
                addlModifier: {value: dialogOptions.defaultModifier}
            },
            dialogOptions.defaultRange,
            false
        );
    }
}

async function esotericAttackDialog(options) {
    if (!options.weapon) {
        ui.notifications.warn(`${options.attackerName} has no esoteric weapons available for attack.`);
        return null;
    }

    const dialogOptions = {
        defaultModifier: options.defaultModifier || 0,
        weapon: options.weapon.name
    };

    if (options.weapon.type === ItemType.SKILL && options.weapon.name.includes('Mental Conflict')) {
        dialogOptions.isEsotericCombat = true;
        dialogOptions.addlInfo = 'Mental Conflict Type: ';
        dialogOptions.mentalConflictType = 'possession';
        dialogOptions.mentalConflictTypes = [
            {key: 'possession', label: 'Possession'},
            {key: 'conflict', label: 'Ethereal Conflict'},
            {key: 'artifact', label: 'Artifact Control'}
        ];
    } else {
        // Not an esoteric weapon!!
        return null;
    }

    dialogOptions.title = `${options.attackerName} vs. ${options.defenderName} ${options.type} with ${options.weapon.name}`;

    const attackDialogTemplate = 'systems/hm3/templates/dialog/esoteric-attack-dialog.hbs';
    const dlghtml = await renderTemplate(attackDialogTemplate, dialogOptions);

    // Request weapon details
    return Dialog.prompt({
        title: dialogOptions.title,
        content: dlghtml.trim(),
        label: options.type,
        callback: (html) => {
            const form = html[0].querySelector('form');
            const formRange = form.range ? form.range.value : null;
            const formMentalConflict = form.mentalConflictType
                ? form.mentalConflictType[form.mentalConflictType.selectedIndex].innerHTML
                : null;

            const result = {
                addlModifier: form.addlModifier ? parseInt(form.addlModifier.value) : 0,
                addlInfo: dialogOptions.isEsotericCombat ? dialogOptions.addlInfo + formMentalConflict : null,
                range: formRange,
                weapon: options.weapon
            };

            return result;
        }
    });
}

/**
 * Determine if the token is valid (must be either a 'creature' or 'character')
 *
 * @param {TokenHM3} token
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
 * @param {TokenHM3} token
 */
function defaultMeleeWeapon(token, sortMode = 'highestDmg') {
    if (!isValidToken(token)) return {weapons: [], defaultWeapon: null};
    if (!['highestDmg', 'highestAML', 'highestDML'].includes(sortMode)) return {weapons: [], defaultWeapon: null};

    const equippedWeapons = token.actor.itemTypes.weapongear.filter((w) => w.system.isEquipped);
    if (equippedWeapons.length === 0) return {weapons: [], defaultWeapon: null};

    let weapons = null;
    switch (sortMode) {
        case 'highestDmg':
            weapons = equippedWeapons.sort((a, b) => {
                const aMax = Math.max(a.system.blunt, a.system.edged, a.system.piercing);
                const bMax = Math.max(b.system.blunt, b.system.edged, b.system.piercing);
                return bMax - aMax;
            });
            break;

        case 'highestAML':
            weapons = equippedWeapons.sort((a, b) => {
                return b.system.attackMasteryLevel - a.system.attackMasteryLevel;
            });
            break;

        case 'highestDML':
            weapons = equippedWeapons.sort((a, b) => {
                return b.system.defenseMasteryLevel - a.system.defenseMasteryLevel;
            });
            break;
    }

    return {
        weapons,
        defaultWeapon: weapons[0]
    };
}

function defaultEsotericWeapon(token) {
    if (!isValidToken(token)) return {weapons: [], defaultWeapon: null};

    const mc = token.actor.items.find((item) => item.type === ItemType.SKILL && item.name.includes('Mental Conflict'));

    if (!mc) {
        ui.notifications.warn(`${token.name} has no equipped Esoteric weapons, attack refused.`);
        return {weapons: [], defaultWeapon: null};
    }

    return {
        weapons: [mc],
        defaultWeapon: mc
    };
}

export function isWpnUnarmed(weapon, token) {
    if (typeof weapon === 'string' || weapon instanceof String) {
        weapon = token?.actor?.items.find((item) => item.name === weapon);
    }

    return !!weapon?.system?.assocSkill?.toLowerCase().includes('unarmed');
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
export async function meleeCounterstrikeResume(
    atkToken,
    defToken,
    atkWeaponName,
    atkEffAML,
    atkAim,
    atkAspect,
    atkImpactMod,
    isGrappleAtk
) {
    if (!isValidToken(atkToken) || !isValidToken(defToken)) return null;
    if (!defToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${atkToken.name}`);
        return null;
    }

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

    // This is a special state of battle frenzy. Any character who enters this mode must take the most
    // aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike.
    // Further Initiative rolls are ignored until the battle ends. (COMBAT 16)
    const berserk = defToken.hasCondition(Condition.BERSERK);
    if (berserk) {
        options.defaultModifier += 20;
    }

    const csDialogResult = await attackDialog(options);
    if (!csDialogResult) return null;

    const atkCloseMode =
        atkToken.hasCondition(Condition.CLOSE_MODE) &&
        !isWpnUnarmed(atkWeaponName, atkToken) &&
        (atkAspect === 'Blunt' || atkAspect === 'Edged');
    const defCloseMode =
        defToken.hasCondition(Condition.CLOSE_MODE) &&
        !csDialogResult.unarmed &&
        (csDialogResult.aspect === 'Blunt' || csDialogResult.aspect === 'Edged');

    csDialogResult.addlModifier += defCloseMode ? -10 : 0;

    // Roll Attacker's Attack
    const atkRoll = await DiceHM3.rollTest({
        data: {},
        diceNum: 1,
        diceSides: 100,
        modifier: 0,
        target: atkEffAML
    });

    const csEffEML = game.hm3.macros.HM100Check(csDialogResult.weapon.system.attackMasteryLevel);

    // Roll Counterstrike Attack
    const csRoll = await DiceHM3.rollTest({
        data: {},
        diceNum: 1,
        diceSides: 100,
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

    const atkDie = atkToken.actor.type === ActorType.CREATURE ? Number(atkToken.actor.system.size) : 6;
    const csDie = defToken.actor.type === ActorType.CREATURE ? Number(defToken.actor.system.size) : 6;

    // Grapple
    const isGrappleDef = csDialogResult.isGrappleAtk;

    const atkResult = `${atkRoll.isCritical ? 'c' : 'm'}${atkRoll.isSuccess ? 's' : 'f'}`;
    const defResult = `${csRoll.isCritical ? 'c' : 'm'}${csRoll.isSuccess ? 's' : 'f'}`;
    const combatResult = meleeCombatResult({
        atkAddlImpact: Number(atkImpactMod),
        atkDie,
        atkResult,
        atkToken,
        defAddlImpact: csDialogResult.impactMod,
        defDie: csDie,
        defense: isGrappleDef ? 'grapple' : 'counterstrike',
        defResult,
        defToken,
        isGrappleAtk,
        isGrappleDef
    });

    // If there was a block, check whether a weapon broke
    const atkWeapon = atkToken.actor.itemTypes.weapongear.find((w) => w.name === atkWeaponName);
    const defWeapon = csDialogResult.weapon;

    let weaponBroke = {attackWeaponBroke: false, defendWeaponBroke: false};
    if (game.settings.get('hm3', 'weaponDamage') && combatResult.outcome.block) {
        weaponBroke = await checkWeaponBreak(atkToken, atkWeapon, defToken, defWeapon);

        // If either of the weapons has broken, then mark the appropriate
        // weapon as "unequipped"

        if (weaponBroke.attackWeaponBroke) {
            try {
                await game.hm3.socket.executeAsGM('weaponBroke', atkToken.id, atkWeapon.id, weaponBroke.atkWeaponDiff);
            } catch (ex) {
                ui.notifications.warn(
                    `You do not have permissions to perform this operation on ${item?.name} from ${atkToken?.actor?.name}`,
                    {
                        permanent: true
                    }
                );
            } finally {
                combatResult.outcome.dta = true;
            }
        }

        if (weaponBroke.defendWeaponBroke) {
            try {
                await game.hm3.socket.executeAsGM('weaponBroke', defToken.id, defWeapon.id, weaponBroke.defWeaponDiff);
            } catch (ex) {
                ui.notifications.warn(
                    `You do not have permissions to perform this operation on ${item?.name} from ${defToken?.actor?.name}`,
                    {
                        permanent: true
                    }
                );
            } finally {
                combatResult.outcome.ata = true;
            }
        }
    }

    let turnEnds = false;
    if (combatResult.outcome.ata && combatResult.outcome.dta) {
        // No more than one Tactical Advantage may be earned per Character Turn.
        // When opponents gain simultaneous TAs, the Turn also ends. (COMBAT 12)
        combatResult.outcome.ata = false;
        combatResult.outcome.dta = false;
        turnEnds = true;
    } else if (combatResult.outcome.ata || combatResult.outcome.dta) {
        // Only one TA per turn
        if (!(await isFirstTA())) {
            combatResult.outcome.ata = false;
            combatResult.outcome.dta = false;
            turnEnds = true;
        } else {
            await setTA();
        }
    }

    // We now know the results of the attack, roll applicable damage
    let atkImpactRoll = null;
    if (combatResult.outcome.atkDice) {
        atkImpactRoll = await new game.hm3.Roll(`${combatResult.outcome.atkDice}d${atkDie}`).evaluate();
    }

    let csImpactRoll = null;
    if (combatResult.outcome.defDice) {
        csImpactRoll = await new game.hm3.Roll(`${combatResult.outcome.defDice}d${csDie}`).evaluate();
    }

    const atkChatData = {
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        atkAim: atkAim,
        atkAspect: atkAspect,
        atkCloseMode,
        atkIsCritical: atkRoll.isCritical,
        atkIsSuccess: atkRoll.isSuccess,
        atkRollResult: atkRoll.description.replace('Substantial', 'Marginal'),
        atkTokenId: atkToken.id,
        atkWeaponBroke: weaponBroke.attackWeaponBroke,
        attacker: atkToken.name,
        attackRoll: atkRoll.rollObj.total,
        attackWeapon: atkWeaponName,
        defender: defToken.name,
        defendWeapon: defWeapon.name,
        defense: 'Counterstrike',
        defenseRoll: 0,
        defRollResult: '',
        defTokenId: defToken.id,
        defWeaponBroke: weaponBroke.defendWeaponBroke,
        effAML: game.hm3.macros.HM100Check(atkEffAML),
        effDML: 0,
        hasAttackHit: isGrappleAtk ? false : !!combatResult.outcome.atkDice,
        impactRoll: atkImpactRoll ? atkImpactRoll.dice[0].values.join(' + ') : null,
        isAtkFumbleRoll: combatResult.outcome.atkFumble,
        isAtkStumbleRoll: combatResult.outcome.atkStumble,
        isDefFumbleRoll: null,
        isDefStumbleRoll: null,
        mlType: 'AML',
        resultDesc: combatResult.desc,
        title: `Attack Result`,
        totalImpact: atkImpactRoll ? atkImpactRoll.total + parseInt(atkImpactMod) : 0,
        visibleAtkActorId: atkToken.actor.id,
        visibleDefActorId: defToken.actor.id,
        weaponImpact: atkImpactMod
    };

    const csChatData = {
        addlModifierAbs: Math.abs(csDialogResult.addlModifier),
        addlModifierSign: csDialogResult.addlModifier < 0 ? '-' : '+',
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        atkAim: csDialogResult.aim,
        atkAspect: csDialogResult.aspect,
        atkBerserk: atkToken.hasCondition(Condition.BERSERK),
        atkIsCritical: csRoll.isCritical,
        atkIsSuccess: csRoll.isSuccess,
        atkProne: atkToken.hasCondition(Condition.PRONE),
        atkRollResult: csRoll.description.replace('Substantial', 'Marginal'),
        atkTokenId: defToken.id,
        attacker: defToken.name,
        attackRoll: csRoll.rollObj.total,
        attackWeapon: csDialogResult.weapon.name,
        defBerserk: defToken.hasCondition(Condition.BERSERK),
        defCloseMode,
        defender: atkToken.name,
        defenseRoll: 0,
        defProne: defToken.hasCondition(Condition.PRONE),
        defRollResult: '',
        defTokenId: atkToken.id,
        dta: combatResult.outcome.dta,
        effAML: game.hm3.macros.HM100Check(csEffEML + csDialogResult.addlModifier),
        effDML: 0,
        effEML: game.hm3.macros.HM100Check(csEffEML + csDialogResult.addlModifier),
        hasAttackHit: isGrappleAtk ? false : !!combatResult.outcome.defDice,
        impactRoll: csImpactRoll ? csImpactRoll.dice[0].values.join(' + ') : null,
        isAtkFumbleRoll: combatResult.outcome.defFumble,
        isAtkStumbleRoll: combatResult.outcome.defStumble,
        isDefFumbleRoll: null,
        isDefStumbleRoll: null,
        mlType: 'AML',
        origEML: csEffEML,
        outnumbered: defToken.actor?.system?.eph?.outnumbered > 1 ? defToken.actor.system.eph.outnumbered : 0,
        resultDesc: combatResult.csDesc,
        title: `Counterstrike Result`,
        totalImpact: csImpactRoll ? csImpactRoll.total + parseInt(csDialogResult.impactMod) : 0,
        visibleAtkActorId: defToken.actor.id,
        visibleDefActorId: atkToken.actor.id,
        weaponImpact: csDialogResult.impactMod
    };

    let chatTemplate = 'systems/hm3/templates/chat/attack-result-card.hbs';

    /*-----------------------------------------------------
     *    Attack Chat
     *----------------------------------------------------*/
    let html = await renderTemplate(chatTemplate, atkChatData);

    let messageData = {
        content: html.trim(),
        speaker: ChatMessage.getSpeaker({token: atkToken}),
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
        user: game.user.id
    };
    if (combatResult.outcome.atkDice) {
        messageData.roll = atkImpactRoll;
        messageData.sound = CONFIG.sounds.dice;
    }

    // Create a chat message
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    await ChatMessage.create(messageData, {});

    /*-----------------------------------------------------
     *    Counterstrike Chat
     *----------------------------------------------------*/
    html = await renderTemplate(chatTemplate, csChatData);

    messageData = {
        content: html.trim(),
        speaker: ChatMessage.getSpeaker({token: defToken}),
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
        user: game.user.id
    };
    if (combatResult.outcome.defDice) {
        messageData.roll = csImpactRoll;
        messageData.sound = CONFIG.sounds.dice;
    }

    // Create a chat message
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    await ChatMessage.create(messageData, {});

    if (combatResult.outcome.atkHold) {
        await defToken.addCondition(Condition.GRAPPLED);
    }
    if (combatResult.outcome.defHold) {
        await atkToken.addCondition(Condition.GRAPPLED);
    }

    if (game.settings.get('hm3', 'autoMarkUsedSkills')) {
        const skill = defWeapon.system.assocSkill;
        defToken.actor.items.forEach((item) => {
            if (item.name === skill && item.type === 'skill') {
                item.update({'system.improveFlag': item.system.improveFlag + 1});
            }
        });
    }

    if (turnEnds) await setTA(true);

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
        ui.notifications.warn(`You do not have permissions to perform this operation on ${atkToken.name}`);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: atkToken});

    const atkRoll = await DiceHM3.rollTest({
        data: {},
        diceSides: 100,
        diceNum: 1,
        modifier: 0,
        target: effAML
    });

    const effDML = game.hm3.macros.HM100Check(defToken.actor.system.dodge);

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

    const atkDie = atkToken.actor.type === ActorType.CREATURE ? atkToken.actor.system.size : 6;

    const atkResult = `${atkRoll.isCritical ? 'c' : 'm'}${atkRoll.isSuccess ? 's' : 'f'}`;
    const defResult = `${defRoll.isCritical ? 'c' : 'm'}${defRoll.isSuccess ? 's' : 'f'}`;
    let combatResult = null;
    if (type === 'melee') {
        combatResult = meleeCombatResult({
            atkAddlImpact: impactMod,
            atkDie,
            atkResult,
            atkToken,
            defense: 'dodge',
            defResult,
            defToken,
            isGrappleAtk
        });
    } else {
        combatResult = missileCombatResult(atkResult, defResult, 'dodge', impactMod);
    }

    let turnEnds = false;
    if (combatResult.outcome.dta) {
        // Only one TA per turn
        if (!(await isFirstTA())) {
            combatResult.outcome.dta = false;
            turnEnds = true;
        } else {
            setTA();
        }
    }

    let atkImpactRoll = null;
    if (combatResult.outcome.atkDice) {
        atkImpactRoll = await new game.hm3.Roll(`${combatResult.outcome.atkDice}d${atkDie}`).evaluate();
    }

    const atkCloseMode =
        atkToken.hasCondition(Condition.CLOSE_MODE) &&
        !isWpnUnarmed(weaponName, atkToken) &&
        (aspect === 'Blunt' || aspect === 'Edged');

    const title = isGrappleAtk ? 'Grapple Result' : 'Attack Result';
    const chatData = {
        addlModifierAbs: Math.abs(defaultModifier),
        addlModifierSign: defaultModifier < 0 ? '-' : '+',
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        atkAim: aim,
        atkAspect: aspect,
        atkCloseMode,
        atkIsCritical: atkRoll.isCritical,
        atkIsSuccess: atkRoll.isSuccess,
        atkProne: atkToken.hasCondition(Condition.PRONE),
        atkRollResult: atkRoll.description.replace('Substantial', 'Marginal'),
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
        defRollResult: defRoll.description.replace('Substantial', 'Marginal'),
        defTokenId: defToken.id,
        dta: combatResult.outcome.dta,
        effAML,
        effDML: game.hm3.macros.HM100Check(effDML + defaultModifier),
        effEML: game.hm3.macros.HM100Check(effDML + defaultModifier),
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

    let chatTemplate = 'systems/hm3/templates/chat/attack-result-card.hbs';

    const html = await renderTemplate(chatTemplate, chatData);

    let messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim()
    };
    if (combatResult.outcome.atkDice) {
        messageData.roll = atkImpactRoll;
        messageData.sound = CONFIG.sounds.dice;
        messageData.style = CONST.CHAT_MESSAGE_STYLES.OTHER;
    } else {
        messageData.style = CONST.CHAT_MESSAGE_STYLES.OTHER;
    }

    const messageOptions = {};

    // Create a chat message
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
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

    if (game.settings.get('hm3', 'autoMarkUsedSkills')) {
        defToken.actor.items.forEach((item) => {
            if (item.name === 'Dodge' && item.type === 'skill') {
                item.update({'system.improveFlag': item.system.improveFlag + 1});
            }
        });
    }

    if (turnEnds) await setTA(true);

    return chatData;
}

export async function esotericResume(atkToken, defToken, atkWeaponName, atkEffAML) {
    if (!isValidToken(atkToken) || !isValidToken(defToken)) return null;
    if (!defToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${atkToken.name}`);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: atkToken});

    const atkRoll = await DiceHM3.rollTest({
        data: {},
        diceSides: 100,
        diceNum: 1,
        modifier: 0,
        target: atkEffAML
    });

    const esotericWpns = defaultEsotericWeapon(defToken);
    const effDML = game.hm3.macros.HM100Check(esotericWpns.defaultWeapon.system.effectiveMasteryLevel);

    let defaultModifier = 0;
    // Living Entity (versus artifact): +10
    if (atkToken.hasCondition(Condition.INANIMATE) && !defToken.hasCondition(Condition.INANIMATE)) {
        defaultModifier += 10;
    }
    // Native Spirit/Aura: +10
    defaultModifier += 10;

    // Unconscious/Sleeping Party: -10
    if (defToken.hasCondition(Condition.UNCONSCIOUS)) {
        defaultModifier -= 10;
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
    const combatResult = esotericCombatResult({
        atkResult,
        atkToken,
        defense: 'mentalConflict',
        defResult,
        defToken
    });

    if (combatResult.outcome.atkFatigue) {
        game.hm3.socket.executeAsGM('fatigueReceived', atkToken.id, combatResult.outcome.atkFatigue);
    }
    if (combatResult.outcome.defFatigue) {
        game.hm3.socket.executeAsGM('fatigueReceived', defToken.id, combatResult.outcome.defFatigue);
    }

    const title = 'Esoteric Attack Result';
    const chatData = {
        addlModifierAbs: Math.abs(defaultModifier),
        addlModifierSign: defaultModifier < 0 ? '-' : '+',
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        // atkEffAML,
        atkIsCritical: atkRoll.isCritical,
        atkIsSuccess: atkRoll.isSuccess,
        atkRollResult: atkRoll.description.replace('Substantial', 'Marginal'),
        atkTokenId: atkToken.id,
        attacker: atkToken.name,
        attackRoll: atkRoll.rollObj.total,
        attackWeapon: atkWeaponName,
        defender: defToken.name,
        defense: esotericWpns.defaultWeapon.name,
        defenseRoll: defRoll.rollObj.total,
        defIsCritical: defRoll.isCritical,
        defIsSuccess: defRoll.isSuccess,
        defRollResult: defRoll.description.replace('Substantial', 'Marginal'),
        defTokenId: defToken.id,
        effAML: atkEffAML,
        effDML: game.hm3.macros.HM100Check(effDML + defaultModifier),
        effEML: game.hm3.macros.HM100Check(effDML + defaultModifier),
        hasAttackHit: false,
        impactRoll: 0,
        isAtkWillShockRoll: !!combatResult.outcome.atkFatigue && !atkToken.hasCondition(Condition.INANIMATE),
        isDefWillShockRoll: !!combatResult.outcome.defFatigue && !defToken.hasCondition(Condition.INANIMATE),
        mlType: 'ML',
        origEML: effDML,
        resultDesc: combatResult.desc,
        title,
        totalImpact: combatResult.outcome.atkFatigue,
        visibleAtkActorId: atkToken.actor.id,
        visibleDefActorId: defToken.actor.id,
        weaponImpact: combatResult.outcome.atkFatigue
    };

    const chatTemplate = 'systems/hm3/templates/chat/attack-result-card.hbs';
    const html = await renderTemplate(chatTemplate, chatData);
    const messageData = {
        content: html.trim(),
        speaker: speaker,
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
        user: game.user.id
    };

    // Create a chat message
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    await ChatMessage.create(messageData, {});

    if (game.settings.get('hm3', 'autoMarkUsedSkills')) {
        esotericWpns.defaultWeapon.update({
            'system.improveFlag': (esotericWpns.defaultWeapon.system.improveFlag || 0) + 1
        });
    }

    return chatData;
}

/**
 * Resume the attack with the defender performing the "Block" defense.
 *
 * @param {TokenHM3} atkToken Token representing the attacker
 * @param {TokenHM3} defToken Token representing the defender
 * @param {*} type Type of attack: "melee" or "missile"
 * @param {*} weaponName Name of the weapon the attacker is using
 * @param {*} effAML The effective AML (Attack Mastery Level) of the attacker after modifiers applied
 * @param {*} aim Attack aim ("High", "Mid", "Low")
 * @param {*} aspect Weapon aspect ("Blunt", "Edged", "Piercing")
 * @param {*} impactMod Additional modifier to impact
 */
export async function blockResume(
    atkToken,
    defToken,
    type,
    weaponName,
    effAML,
    aim,
    aspect,
    impactMod,
    isGrappleAtk,
    noDialog = false
) {
    if (!isValidToken(atkToken) || !isValidToken(defToken)) return null;
    if (!defToken.isOwner) {
        ui.notifications.warn(`You do not have permissions to perform this operation on ${atkToken.name}`);
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
    let defAvailWeapons = defaultMeleeWeapon(defToken, 'highestDML').weapons; //defToken.actor.itemTypes.weapongear;
    const shields = defAvailWeapons.filter((w) => w.system.isEquipped && /shield|\bbuckler\b/i.test(w.name));

    let atkWeapon = null;
    // Missile Pre-processing.  If attacker is using a high-velocity weapon, then defender
    // can only block with a shield.  If attacker is using a low-velocity weapon, then defender
    // can either block with a shield (at full DML) or with a melee weapon (at 1/2 DML).
    if (type === 'missile') {
        atkWeapon = atkToken.actor.itemTypes.missilegear.find((w) => w.name === weaponName);
        const highVelocityMissile = /\bbow\b|shortbow|longbow|crossbow|\bsling\b|\barrow\b|\bbolt\b|\bbullet\b/i.test(
            weaponName
        );

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
    let weapons = defAvailWeapons;
    let defaultWeapon = defAvailWeapons[0];

    if (weapons.length === 0) {
        return ui.notifications.warn(
            `${defToken.name} has no weapons that can be used for blocking, block defense refused.`
        );
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
        defaultModifier: defaultModifier,
        defaultWeapon: defaultWeapon,
        modifierType: 'Defense',
        name: defToken.name,
        noDialog,
        prompt: prompt,
        weapons: weapons
    };
    const dialogResult = await selectWeaponDialog(options);

    if (!dialogResult) return null;

    let effDML;
    const defWeapon = defToken.actor.itemTypes.weapongear.find((w) => w.name === dialogResult.weapon);
    if (defWeapon) {
        effDML = game.hm3.macros.HM100Check(defWeapon.system.defenseMasteryLevel);
    } else {
        effDML = 5;
    }

    // If attacking weapon is a missile and defending weapon is not
    // a shield, then it will defend at 1/2 DML.
    if (type === 'missile') {
        if (!shields.some((s) => s.name === dialogResult.weapon.name)) {
            effDML = game.hm3.macros.HM100Check(effDML / 2);
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

    const atkDie = atkToken.actor.type === ActorType.CREATURE ? Number(atkToken.actor.system.size) : 6;

    let combatResult;
    if (type === 'melee') {
        combatResult = meleeCombatResult({
            atkAddlImpact: Number(impactMod),
            atkDie,
            atkResult,
            atkToken,
            defense: 'block',
            defResult,
            defToken,
            isGrappleAtk
        });
    } else {
        combatResult = missileCombatResult(atkResult, defResult, 'block', impactMod);
    }

    // If there was a block, check whether a weapon broke
    let weaponBroke = {attackWeaponBroke: false, defendWeaponBroke: false};
    if (game.settings.get('hm3', 'weaponDamage') && combatResult.outcome.block) {
        weaponBroke = await checkWeaponBreak(atkToken, atkWeapon, defToken, defWeapon);

        // If either of the weapons has broken, then mark the appropriate
        // weapon as "unequipped"

        if (weaponBroke.attackWeaponBroke) {
            try {
                await game.hm3.socket.executeAsGM('weaponBroke', atkToken.id, atkWeapon.id, weaponBroke.atkWeaponDiff);
            } catch (ex) {
                ui.notifications.warn(
                    `You do not have permissions to perform this operation on ${item?.name} from ${atkToken?.actor?.name}`,
                    {
                        permanent: true
                    }
                );
            } finally {
                combatResult.outcome.dta = true;
            }
        }

        if (weaponBroke.defendWeaponBroke) {
            try {
                await game.hm3.socket.executeAsGM('weaponBroke', defToken.id, defWeapon.id, weaponBroke.defWeaponDiff);
            } catch (ex) {
                ui.notifications.warn(
                    `You do not have permissions to perform this operation on ${item?.name} from ${defToken?.actor?.name}`,
                    {
                        permanent: true
                    }
                );
            } finally {
                combatResult.outcome.ata = true;
            }
        }
    }

    let turnEnds = false;
    if (combatResult.outcome.ata && combatResult.outcome.dta) {
        // No more than one Tactical Advantage may be earned per Character Turn.
        // When opponents gain simultaneous TAs, the Turn also ends. (COMBAT 12)
        combatResult.outcome.ata = false;
        combatResult.outcome.dta = false;
        turnEnds = true;
    } else if (combatResult.outcome.ata || combatResult.outcome.dta) {
        // Only one TA per turn
        if (!(await isFirstTA())) {
            combatResult.outcome.ata = false;
            combatResult.outcome.dta = false;
            turnEnds = true;
        } else {
            await setTA();
        }
    }

    let atkImpactRoll = null;
    if (combatResult.outcome.atkDice) {
        atkImpactRoll = await new game.hm3.Roll(`${combatResult.outcome.atkDice}d${atkDie}`).evaluate();
    }

    const atkCloseMode =
        atkToken.hasCondition(Condition.CLOSE_MODE) &&
        !isWpnUnarmed(weaponName, atkToken) &&
        (aspect === 'Blunt' || aspect === 'Edged');

    const title = isGrappleAtk ? 'Grapple Result' : 'Attack Result';
    const chatData = {
        addlModifierAbs: Math.abs(dialogResult.addlModifier),
        addlModifierSign: dialogResult.addlModifier < 0 ? '-' : '+',
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        ata: combatResult.outcome.ata,
        atkAim: aim,
        atkAspect: aspect,
        atkCloseMode,
        atkIsCritical: atkRoll.isCritical,
        atkIsSuccess: atkRoll.isSuccess,
        atkProne: atkToken.hasCondition(Condition.PRONE),
        atkRollResult: atkRoll.description.replace('Substantial', 'Marginal'),
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
        defRollResult: defRoll.description.replace('Substantial', 'Marginal'),
        defTokenId: defToken.id,
        defWeaponBroke: weaponBroke.defendWeaponBroke,
        dta: combatResult.outcome.dta,
        effAML,
        effDML: game.hm3.macros.HM100Check(effDML + dialogResult.addlModifier),
        effEML: game.hm3.macros.HM100Check(effDML + dialogResult.addlModifier),
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

    let chatTemplate = 'systems/hm3/templates/chat/attack-result-card.hbs';

    const html = await renderTemplate(chatTemplate, chatData);

    let messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim()
    };
    if (combatResult.outcome.atkDice) {
        messageData.roll = atkImpactRoll;
        messageData.sound = CONFIG.sounds.dice;
        messageData.style = CONST.CHAT_MESSAGE_STYLES.OTHER;
    } else {
        messageData.style = CONST.CHAT_MESSAGE_STYLES.OTHER;
    }

    const messageOptions = {};

    // Create a chat message
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
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

    if (game.settings.get('hm3', 'autoMarkUsedSkills')) {
        const skill = defWeapon.system.assocSkill;
        defToken.actor.items.forEach((item) => {
            if (item.name === skill && item.type === 'skill') {
                item.update({'system.improveFlag': item.system.improveFlag + 1});
            }
        });
    }

    if (turnEnds) await setTA(true);

    return chatData;
}

/**
 *
 * @param {TokenHM3} atkToken
 * @param {ItemHM3} atkWeapon
 * @param {TokenHM3} defToken
 * @param {ItemHM3} defWeapon
 * @returns {Promise<{attackWeaponBroke: boolean, defendWeaponBroke: boolean}>} Promise with break info
 */
export async function checkWeaponBreak(atkToken, atkWeapon, defToken, defWeapon) {
    if (!atkWeapon || !atkToken) {
        console.error(`HM3 | Attack weapon was not specified`);
        return {attackWeaponBroke: false, defendWeaponBroke: false};
    }

    if (!defWeapon || !defToken) {
        console.error(`HM3 | Defend weapon was not specified`);
        return {attackWeaponBroke: false, defendWeaponBroke: false};
    }

    // Weapon Break Check
    let atkWeaponBroke = false;
    let defWeaponBroke = false;
    let atkBreakCheckNotNeeded = false;
    let defBreakCheckNotNeeded = false;
    let atkWeaponDiff = 0;
    let defWeaponDiff = 0;
    let atkBreakTotal = 0;
    let defBreakTotal = 0;

    // Get the Arcane Powers of the weapons for break check
    const atkSwordbreaker = atkWeapon.getArcanePower(ArcanePower.SWORDBREAKER);
    const atkWardAkana = atkWeapon.getArcanePower(ArcanePower.WARD_AKANA);
    const atkWarded = !!atkWardAkana && !defWeapon.isArtifact;
    const defSwordbreaker = defWeapon.getArcanePower(ArcanePower.SWORDBREAKER);
    const defWardAkana = defWeapon.getArcanePower(ArcanePower.WARD_AKANA);
    const defWarded = !!defWardAkana && !atkWeapon.isArtifact;

    // Regular weapon quality
    const atkWeaponQuality = atkWeapon.system.weaponQuality + (atkWeapon.system.wqModifier || 0);
    const defWeaponQuality = defWeapon.system.weaponQuality + (defWeapon.system.wqModifier || 0);

    // Separate break rolls for each weapon and Swordbreaker rolls if applicable
    let atkBreakRoll = await new game.hm3.Roll(`3d6`).evaluate();
    let defBreakRoll = await new game.hm3.Roll(`3d6`).evaluate();
    let atkSwordbreakerRoll = await new game.hm3.Roll(`0`).evaluate();
    let defSwordbreakerRoll = await new game.hm3.Roll(`0`).evaluate();

    if (atkSwordbreaker?.isOwnerAware) {
        defBreakRoll = await new game.hm3.Roll(`3d6+1d${atkSwordbreaker.lvl}`).evaluate();
    } else if (atkSwordbreaker) {
        defSwordbreakerRoll = await new game.hm3.Roll(`1d${atkSwordbreaker.lvl}`).evaluate();
    }
    if (defSwordbreaker?.isOwnerAware) {
        atkBreakRoll = await new game.hm3.Roll(`3d6+1d${defSwordbreaker.lvl}`).evaluate();
    } else if (defSwordbreaker) {
        atkSwordbreakerRoll = await new game.hm3.Roll(`1d${defSwordbreaker.lvl}`).evaluate();
    }

    atkBreakTotal = atkBreakRoll.total;
    defBreakTotal = defBreakRoll.total;

    // If either weapon has Ward Akana, then it cannot break
    if (atkWarded && atkWardAkana?.isOwnerAware) {
        atkBreakCheckNotNeeded = true;
    } else if (atkWarded) {
        atkBreakTotal = Math.min(atkBreakTotal, atkWeaponQuality);
    }
    if (defWarded && defWardAkana?.isOwnerAware) {
        defBreakCheckNotNeeded = true;
    } else if (defWarded) {
        defBreakTotal = Math.min(defBreakTotal, defWeaponQuality);
    }

    // SPECIAL: WQ of 0 never breaks and cannot break other weapons
    if (atkWeaponQuality === 0 || defWeaponQuality === 0) {
        atkBreakCheckNotNeeded = true;
        defBreakCheckNotNeeded = true;
    }

    if (atkWeaponQuality <= defWeaponQuality) {
        // Check attacker first, then defender
        if (!atkBreakCheckNotNeeded) {
            if (atkBreakTotal > atkWeaponQuality) {
                defBreakCheckNotNeeded = true;
                atkWeaponBroke = true;
                atkWeaponDiff = atkBreakTotal - atkWeaponQuality;
            } else if (atkBreakTotal + atkSwordbreakerRoll.total > atkWeaponQuality) {
                // Owner is not aware of the Swordbreaker
                defBreakCheckNotNeeded = true;
                atkWeaponBroke = true;
                atkBreakTotal = Math.min(atkBreakTotal + atkSwordbreakerRoll.total, 18);
                atkWeaponDiff = atkBreakTotal - atkWeaponQuality;
            }
        }

        if (!defBreakCheckNotNeeded) {
            if (!atkWeaponBroke && defBreakTotal > defWeaponQuality) {
                defWeaponBroke = true;
                defWeaponDiff = defBreakTotal - defWeaponQuality;
            } else if (!atkWeaponBroke && defBreakTotal + defSwordbreakerRoll.total > defWeaponQuality) {
                // Owner is not aware of the Swordbreaker
                defWeaponBroke = true;
                defBreakTotal = Math.min(defBreakTotal + defSwordbreakerRoll.total, 18);
                defWeaponDiff = defBreakTotal - defWeaponQuality;
            }
        }
    } else {
        // Check defender first, then attacker
        if (!defBreakCheckNotNeeded) {
            if (defBreakTotal > defWeaponQuality) {
                atkBreakCheckNotNeeded = true;
                defWeaponBroke = true;
                defWeaponDiff = defBreakTotal - defWeaponQuality;
            } else if (defBreakTotal + defSwordbreakerRoll.total > defWeaponQuality) {
                // Owner is not aware of the Swordbreaker
                atkBreakCheckNotNeeded = true;
                defWeaponBroke = true;
                defBreakTotal = Math.min(defBreakTotal + defSwordbreakerRoll.total, 18);
                defWeaponDiff = defBreakTotal - defWeaponQuality;
            }
        }

        if (!atkBreakCheckNotNeeded) {
            if (!defWeaponBroke && atkBreakTotal > atkWeaponQuality) {
                atkWeaponBroke = true;
                atkWeaponDiff = atkBreakTotal - atkWeaponQuality;
            } else if (!defWeaponBroke && atkBreakTotal + atkSwordbreakerRoll.total > atkWeaponQuality) {
                // Owner is not aware of the Swordbreaker
                atkWeaponBroke = true;
                atkBreakTotal = Math.min(atkBreakTotal + atkSwordbreakerRoll.total, 18);
                atkWeaponDiff = atkBreakTotal - atkWeaponQuality;
            }
        }
    }

    const chatData = {};

    const messageData = {
        sound: CONFIG.sounds.dice,
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
        user: game.user.id
    };

    const chatTemplate = 'systems/hm3/templates/chat/weapon-break-card.hbs';

    // Prepare and generate Attack Weapon Break chat message

    chatData.tokenName = atkToken.name;
    chatData.weaponName = atkWeapon.name;
    chatData.weaponQuality = atkWeapon.system.weaponQuality + (atkWeapon.system.wqModifier || 0);
    chatData.weaponBroke = atkWeaponBroke;
    chatData.rollValue = atkBreakTotal;
    chatData.actorId = atkWeapon.parent;
    chatData.title = 'Attack Weapon Break Check';

    let html = await renderTemplate(chatTemplate, chatData);

    messageData.content = html.trim();
    messageData.speaker = ChatMessage.getSpeaker({token: atkToken});
    messageData.roll = atkBreakRoll;

    const messageOptions = {};

    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    if (!atkBreakCheckNotNeeded) await ChatMessage.create(messageData, messageOptions);

    // Prepare and generate Defend Weapon Break chat message

    chatData.tokenName = defToken.name;
    chatData.weaponName = defWeapon.name;
    chatData.weaponQuality = defWeapon.system.weaponQuality + (defWeapon.system.wqModifier || 0);
    chatData.weaponBroke = defWeaponBroke;
    chatData.rollValue = defBreakTotal;
    chatData.actorId = defWeapon.parent;
    chatData.title = 'Defend Weapon Break Check';

    html = await renderTemplate(chatTemplate, chatData);

    messageData.content = html.trim();
    messageData.speaker = ChatMessage.getSpeaker({token: defToken});
    messageData.roll = defBreakRoll;

    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    if (!defBreakCheckNotNeeded) await ChatMessage.create(messageData, messageOptions);

    return {attackWeaponBroke: atkWeaponBroke, atkWeaponDiff, defendWeaponBroke: defWeaponBroke, defWeaponDiff};
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
        ui.notifications.warn(`You do not have permissions to perform this operation on ${atkToken.name}`);
        return null;
    }

    const speaker = ChatMessage.getSpeaker({token: atkToken});

    const atkRoll = await DiceHM3.rollTest({
        data: {},
        diceSides: 100,
        diceNum: 1,
        modifier: 0,
        target: effAML
    });

    if (game.dice3d) {
        const aRoll = atkRoll.rollObj;
        aRoll.dice[0].options.colorset = 'glitterparty';
        await game.dice3d.showForRoll(aRoll, game.user, true);
    }

    const atkDie = atkToken.actor.type === ActorType.CREATURE ? Number(atkToken.actor.system.size) : 6;

    const atkResult = `${atkRoll.isCritical ? 'c' : 'm'}${atkRoll.isSuccess ? 's' : 'f'}`;
    let combatResult;
    if (type === 'melee') {
        combatResult = meleeCombatResult({
            atkAddlImpact: Number(impactMod),
            atkDie,
            atkResult,
            atkToken,
            defense: 'ignore',
            defToken,
            isGrappleAtk
        });
    } else {
        combatResult = missileCombatResult(atkResult, null, 'ignore', impactMod);
    }

    let atkImpactRoll = null;
    if (combatResult.outcome.atkDice) {
        atkImpactRoll = await new game.hm3.Roll(`${combatResult.outcome.atkDice}d${atkDie}`).evaluate();
    }

    const atkCloseMode =
        atkToken.hasCondition(Condition.CLOSE_MODE) &&
        !isWpnUnarmed(weaponName, atkToken) &&
        (aspect === 'Blunt' || aspect === 'Edged');

    const title = isGrappleAtk ? 'Grapple Result' : 'Attack Result';
    const chatData = {
        addlWeaponImpact: 0, // in future, maybe ask this in dialog?
        atkAim: aim,
        atkAspect: aspect,
        atkCloseMode,
        atkDice: combatResult.outcome.atkDice,
        atkIsCritical: atkRoll.isCritical,
        atkIsSuccess: atkRoll.isSuccess,
        atkRollResult: atkRoll.description.replace('Substantial', 'Marginal'),
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

    let chatTemplate = 'systems/hm3/templates/chat/attack-result-card.hbs';

    const html = await renderTemplate(chatTemplate, chatData);

    let messageData = {
        user: game.user.id,
        speaker: speaker,
        content: html.trim()
    };
    if (combatResult.outcome.atkDice) {
        messageData.roll = atkImpactRoll;
        messageData.sound = CONFIG.sounds.dice;
        messageData.style = CONST.CHAT_MESSAGE_STYLES.OTHER;
    } else {
        messageData.style = CONST.CHAT_MESSAGE_STYLES.OTHER;
    }

    const messageOptions = {};

    // Create a chat message
    ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
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
export function meleeCombatResult({
    atkAddlImpact = 0,
    atkDie = 6,
    atkResult,
    atkToken,
    defAddlImpact = 0,
    defDie = 6,
    defense,
    defResult = null,
    defToken,
    isGrappleAtk = false,
    isGrappleDef = false
}) {
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

    if (outcome.atkFumble && atkToken?.hasCondition(Condition.NO_FUMBLE)) {
        outcome.atkFumble = false;
    }
    if (outcome.defFumble && defToken?.hasCondition(Condition.NO_FUMBLE)) {
        outcome.defFumble = false;
    }
    if (outcome.atkStumble && atkToken?.hasCondition(Condition.NO_STUMBLE)) {
        outcome.atkStumble = false;
    }
    if (outcome.defStumble && defToken?.hasCondition(Condition.NO_STUMBLE)) {
        outcome.defStumble = false;
    }

    const result = {
        atkHold: !!outcome.atkHold,
        csDesc: isGrappleDef ? 'Grapple attempt unsuccessful' : 'Counterstrike misses',
        defHold: !!outcome.defHold,
        desc: isGrappleAtk ? 'Grapple attempt unsuccessful' : 'Attack misses',
        outcome
    };

    if (defense !== 'counterstrike') {
        if (outcome.atkHold) {
            result.desc = `Attacker obtains hold`;
        } else if (outcome.atkDice) {
            result.desc = `Attacker strikes for ${diceFormula(outcome.atkDice, atkAddlImpact, atkDie)} impact`;
        } else if (outcome.atkFumble && outcome.defFumble) {
            result.desc = 'Both attacker and defender fumble';
        } else if (outcome.atkFumble) {
            result.desc = `Attacker fumbles`;
        } else if (outcome.defFumble) {
            result.desc = `Defender fumbles`;
        } else if (outcome.defStumble && outcome.atkStumble) {
            result.desc = `Both attacker and defender stumble`;
        } else if (outcome.atkStumble) {
            result.desc = `Attacker stumbles`;
        } else if (outcome.defStumble) {
            result.desc = `Defender stumbles`;
        } else if (outcome.block) {
            result.desc = `Attack blocked`;
        } else if (outcome.dta) {
            result.desc = `Defender gains a Tactical Advantage`;
        }
    } else {
        if (outcome.atkHold && outcome.defHold) {
            result.desc = `Both attacker and defender obtain hold`;
        } else if (outcome.atkHold) {
            result.desc = `Attacker obtains hold`;
        } else if (outcome.atkDice) {
            result.desc = `Attacker strikes for ${diceFormula(outcome.atkDice, atkAddlImpact, atkDie)} impact`;
        } else if (outcome.atkFumble) {
            result.desc = `Attacker fumbles`;
        } else if (outcome.atkStumble) {
            result.desc = `Attacker stumbles`;
        }

        if (outcome.atkHold && outcome.defHold) {
            result.desc = `Both attacker and defender obtain hold`;
        } else if (outcome.defHold) {
            result.csDesc = `Defender obtains hold`;
        } else if (outcome.defDice) {
            result.csDesc = `Counterstriker strikes for ${diceFormula(outcome.defDice, defAddlImpact, defDie)} impact`;
        } else if (outcome.defFumble) {
            result.csDesc = 'Counterstriker fumbles';
        } else if (outcome.defStumble) {
            result.csDesc = 'Counterstriker stumbles';
        } else if (outcome.block) {
            result.desc = 'Attacker blocked.';
            result.csDesc = `Counterstriker blocked`;
        } else if (outcome.dta) {
            result.csDesc = `Counterstriker gains a Tactical Advantage!`;
        } else if (outcome.miss) {
            result.csDesc = `Counterstrike misses`;
        }
    }

    return result;
}

export function esotericCombatResult({atkResult, atkToken, defense, defResult, defToken}) {
    let outcome = null;
    let index = null;
    const defenseTable = HM3.mentalConflictCombatTable[defense];
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
        desc: '',
        outcome
    };

    if (outcome.atkFatigue === outcome.defFatigue) {
        result.desc = `<p>Stalemate, both attacker and defender lose ${outcome.atkFatigue} Fatigue Level${
            outcome.atkFatigue > 1 ? 's' : ''
        }</p>`;
        result.csDesc = result.desc;
    } else if (outcome.atkFatigue) {
        result.desc = `<p>Defender was able to successfully withstand the esoteric attack</p><p>Attacker receives ${
            outcome.atkFatigue
        } Fatigue level${outcome.atkFatigue > 1 ? 's' : ''}</p>`;
    } else if (outcome.defFatigue) {
        result.desc = `<p>Estoric Attack successful</p><p>Defender receives ${outcome.defFatigue} Fatigue Level${
            outcome.defFatigue > 1 ? 's' : ''
        }</p>`;
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
function diceFormula(numDice, addlImpact, die = 6) {
    if (numDice <= 0) {
        return 'no';
    }
    if (addlImpact) {
        return `${numDice}d${die}${addlImpact < 0 ? '-' : '+'}${Math.abs(addlImpact)}`;
    } else {
        return `${numDice}d${die}`;
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
        if (data.blunt >= 0) result.aspects[Aspect.BLUNT] = data.blunt;
        if (data.edged >= 0) result.aspects[Aspect.EDGED] = data.edged;
        if (data.piercing >= 0) result.aspects[Aspect.PIERCING] = data.piercing;
        if (maxImpact === data.piercing) {
            result.defaultAspect = Aspect.PIERCING;
        } else if (maxImpact === data.edged) {
            result.defaultAspect = Aspect.EDGED;
        } else if (maxImpact === data.blunt) {
            result.defaultAspect = Aspect.BLUNT;
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

    let item = fromUuidSync(itemName);

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
 * @param {TokenHM3} sourceToken
 * @param {TokenHM3} targetToken
 * @param {Boolean} gridUnits If true, return in grid units, not "scene" units
 */
export function rangeToTarget(sourceToken, targetToken, gridUnits = false) {
    if (!sourceToken || !targetToken || !canvas.scene || !canvas.scene.grid) return 9999;

    const distance = game.hm3.macros.distanceBtwnTwoTokens(sourceToken.id, targetToken.id); // [ft]
    // console.info(`Distance = ${truncate(distance, 0)}, gridUnits=${gridUnits}`);
    if (gridUnits) return truncate(distance / canvas.dimensions.distance, 0);
    return truncate(distance, 0);
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

/**
 *
 * @returns True, if no TA has been received so far in this turn.
 */
async function isFirstTA() {
    return game.hm3.socket.executeAsGM('isFirstTA');
}

/**
 *
 * @param {boolean} [autoend=false] (defaults to false)
 * @returns {Promise<boolean>}
 */
export async function setTA(autoend = false) {
    if ((await isFirstTA()) && !autoend) {
        await game.hm3.socket.executeAsGM('setTAFlag');
        return true;
    } else {
        await game.hm3.GmSays({
            text: 'No more than one <b>Tactical Advantage</b> may be earned per character turn. <b>Turn ends.</b>',
            source: 'Combat 12'
        });
        await game.combat.combatant.token.turnEnds();
        return false;
    }
}

/**
 *
 * @returns {string[]}
 */
export function outnumberedConditions() {
    return [
        game.hm3.Condition.CAUTIOUS,
        game.hm3.Condition.DISTRACTED,
        game.hm3.Condition.DYING,
        game.hm3.Condition.GRAPPLED,
        game.hm3.Condition.INCAPACITATED,
        game.hm3.Condition.PRONE,
        game.hm3.Condition.SHOCKED,
        game.hm3.Condition.UNCONSCIOUS
    ];
}

export async function updateOutnumbered() {
    const all = canvas.scene.tokens.contents;
    const friendly = all.filter((t) => t.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY);
    const hostile = all.filter((t) => t.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE);

    // const friendly = all.filter((token) =>
    //     [CONST.TOKEN_DISPOSITIONS.FRIENDLY, CONST.TOKEN_DISPOSITIONS.NEUTRAL, CONST.TOKEN_DISPOSITIONS.SECRET].includes(token.disposition)
    // );
    // const hostile = all.filter((token) =>
    //     [CONST.TOKEN_DISPOSITIONS.HOSTILE, CONST.TOKEN_DISPOSITIONS.NEUTRAL, CONST.TOKEN_DISPOSITIONS.SECRET].includes(token.disposition)
    // );

    const engaged = new Map();

    friendly.forEach((fDoc) => {
        const e = [
            ...hostile
                .filter((hDoc) => rangeToTarget(fDoc.object, hDoc.object) < 5.1 && hDoc.object.hasEngagementZone())
                .map((t) => t.object)
        ];
        engaged.set(fDoc.object.id, e);
    });
    hostile.forEach((hDoc) => {
        const e = [
            ...friendly
                .filter((fDoc) => rangeToTarget(fDoc.object, hDoc.object) < 5.1 && fDoc.object.hasEngagementZone())
                .map((t) => t.object)
        ];
        engaged.set(hDoc.object.id, e);
    });

    const tokens = [];
    for (let i = 0; i < all.length; i++) {
        const token = all[i];
        if (token.hasCondition(Condition.NO_OUTNUMBERED)) continue;
        const e = engaged.get(token.id);
        if (e && e.length > 1) {
            const exclusivelyEngaged = [...e.filter((t) => engaged.get(t.id).length === 1)];
            const outnumbered = exclusivelyEngaged.length >= 2;
            if (outnumbered) {
                // Outnumbered
                const label = `${Condition.OUTNUMBERED} ${exclusivelyEngaged.length}:1`;
                if (!token.hasCondition(label)) {
                    await token.deleteCondition(Condition.OUTNUMBERED);
                    await token.addCondition(Condition.OUTNUMBERED, {outnumbered: exclusivelyEngaged.length});
                    tokens.push(token);
                }
            } else {
                // Not outnumbered
                if (token.hasCondition(Condition.OUTNUMBERED)) {
                    await token.deleteCondition(Condition.OUTNUMBERED);
                    tokens.push(token);
                }
            }
        } else {
            // Not outnumbered
            if (token.hasCondition(Condition.OUTNUMBERED)) {
                await token.deleteCondition(Condition.OUTNUMBERED);
                tokens.push(token);
            }
        }
    }

    console.info(`HM3 | Outnumbered updated: `, tokens.length > 0, tokens);

    return {changed: tokens.length > 0, tokens};
}
