// const UNCONSCIOUS_ICON = 'systems/hm3/images/icons/svg/shock.svg';

/**
 *
 * @param {TokenHM3} token
 * @param {Object} [options={}] - Options for the condition
 * @param {boolean} [options.oneRoll=false] - Only one roll defaults to false
 * @param {boolean} [options.oneRound=false] - Only one round defaults to false
 * @param {boolean} [options.oneTurn=false] - Only one turn defaults to false
 * @param {number} [options.outnumbered=1] - Outnumbered defaults to 1
 * @returns
 */
export async function createCondition(token, options = {}) {
    if (!token) return false;

    // Inanimate creatures cannot get unconscious
    if (token.hasCondition(game.hm3.Condition.INANIMATE)) return false;

    const CONDITION = game.hm3.Condition.UNCONSCIOUS;
    console.info(`HM3 | Creating condition: ${CONDITION} for token: ${token.name}`, options);

    const uuid = foundry.utils.randomID();

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
await token.deleteAllMoraleConditions();
await token.addCondition(game.hm3.Condition.PRONE);
const almostDying = !token.player && token.actor.system.shockIndex.value < game.hm3.CONST.COMBAT.SHOCK_INDEX_THRESHOLD;
if (almostDying) {
    await token.combatant?.update({defeated: true});
    await game.hm3.GmSays({
        text: '<b>' + token.name + '</b> is <b>Defeated</b> due to <b>Too Many Wounds</b>.',
        source: 'House Rule',
        token
    });
} else if (!token.dying) {
    await game.hm3.GmSays({
        text:
            'Overwhelmed by pain, blood loss, and exhaustion, <b>' +
            token.name +
            '</b> collapses unconscious onto the battlefield, falling <b>Prone</b> amidst the chaos.',
        source: 'Combat 14',
        token
    });
}
console.info('HM3 | Condition: ${CONDITION} created for token: ${token.name}');
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
if (token.dying || token.combatant.isDefeated) return;
await game.hm3.GmSays({
    text: '<b>' + token.name + '</b> needs a successful <b>Shock</b> roll to regain consciousness.',
    source: 'Combat 14',
    gmonly: !token.player,
    token
});
const success = (await game.hm3.macros.shockRoll(!token.player, token.actor, token, 1)).isSuccess;
if (success) {
    // Combatant regains consciousness
    await game.hm3.GmSays({
        text:
            '<b>' +
            token.name +
            '</b> regains consciousness and starts coming back to full senses, though stability remains uncertain. Another <b>Shock Roll</b> is needed.',
        source: 'Combat 14',
        token
    });
    token.disableCondition('${CONDITION}', 500); // postpone a bit
} else {
    // Combatant stays unconscious
    await game.hm3.GmSays({
        text: '<b>' + token.name + '</b> stays unconscious. <b>Turn ends.</b>',
        source: 'Combat 14',
        token
    });
    await token.turnEnds();
}
`;

    // On disable (regain consciousness), make a last SHOCK roll (SKILLS 22, COMBAT 14)
    const ON_DISABLE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
if (!game.combat?.started && !token.player) return;
const ok = (await game.hm3.macros.shockRoll(!token.player, token.actor, token, 2)).isSuccess;
await token.deleteCondition('${CONDITION}');
if (ok) {
    // Combatant is back
    await game.hm3.GmSays({
        text: '<b>' + token.name + '</b> regains consciousness and resumes functioning normally. <b>Turn Ends.</b>',
        source: 'Combat 14'
    });
    await token.turnEnds();
} else {
    // Combatant is now SHOCKED
    await token.addCondition(game.hm3.Condition.SHOCKED);
}
`;

    const ON_DELETE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
game.hm3.macros.updateOverlay(token);
console.info("HM3 | Condition: ${CONDITION} deleted for token: ${token.name}");
`;

    return {
        effectData: {
            label: CONDITION,
            token,
            icon: CONFIG.statusEffects.find((e) => e.id === 'unconscious').img, // UNCONSCIOUS_ICON
            type: 'GameTime',
            seconds: await game.hm3.macros.rollResultAsync(`2d6 * ${game.hm3.CONST.TIME.MINUTE}`), // 2d6 minutes
            flags: {
                effectmacro: {
                    onCreate: {script: ON_CREATE_MACRO},
                    onTurnStart: {script: ON_TURN_START_MACRO},
                    onDisable: {script: ON_DISABLE_MACRO},
                    onDelete: {script: ON_DELETE_MACRO}
                },
                hm3: {uuid}
            }
        },
        changes: [],
        options: {overlay: !token.hasCondition(game.hm3.Condition.DYING), unique: true}
    };
}
