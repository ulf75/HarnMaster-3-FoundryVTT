// const UNCONSCIOUS_ICON = 'systems/hm3/images/icons/svg/shock.svg';
const MINUTE = 60;

/**
 *
 * @param {Token} token
 * @returns
 */
export async function createUnconsciousCondition(token) {
    if (!token) return;

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
const dying = token.hasCondition(game.hm3.enums.Condition.DYING);
const prone = token.hasCondition(game.hm3.enums.Condition.PRONE);
if (!prone) token.addCondition(game.hm3.enums.Condition.PRONE);
if (!dying) {
    await game.hm3.GmSays("Overwhelmed by pain, blood loss, and exhaustion, <b>" + token.name + "</b> collapses unconscious onto the battlefield, falling <b>Prone</b> amidst the chaos.", "Combat 14");
    await token.actor.toggleStatusEffect('unconscious', {active: true, overlay: true});
    await token.combatant.rollInitiative();
}
await token.combatant.update({defeated: true});
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
const dying = token.hasCondition(game.hm3.enums.Condition.DYING);
if (dying) return;
await game.hm3.GmSays("<b>" + token.name + "</b> needs a successful <b>Shock</b> roll to regain consciousness.", "Combat 14");
const success = (await game.hm3.macros.shockRoll(false, token.actor, token)).isSuccess;
if (success) {
    // Combatant regains consciousness
    await game.hm3.GmSays("<b>" + token.name + "</b> regains consciousness and starts coming back to full senses, though stability remains uncertain. Another <b>Shock Roll</b> is needed.", "Combat 14");
    token.disableCondition(game.hm3.enums.Condition.UNCONSCIOUS, 500); // postpone a bit
    await token.actor.toggleStatusEffect('unconscious', {active: false});
} else {
    // Combatant stays unconscious
    await game.hm3.GmSays("<b>" + token.name + "</b> stays unconscious. <b>Turn ends.</b>", "Combat 14");
    await game.combats.active.nextTurn(500); // delay so that other hooks are executed first
}`;

    // On disable (regain consciousness), make a last SHOCK roll (SKILLS 22, COMBAT 14)
    const ON_DISABLE_MACRO = `
const token = canvas.tokens.get('${token.id}');
const ok = (await game.hm3.macros.shockRoll(false, token.actor, token)).isSuccess;
await token.deleteCondition(game.hm3.enums.Condition.UNCONSCIOUS);
await token.combatant.update({defeated: false});
if (ok) {
    // Combatant is back
    await game.hm3.GmSays("<b>" + token.name + "</b> regains consciousness and resumes functioning normally. <b>Turn Ends.</b>", "Combat 14");
    await game.combats.active.nextTurn(500); // delay so that other hooks are executed first
} else {
    // Combatant is now SHOCKED
    token.addCondition(game.hm3.enums.Condition.SHOCKED);
}`;

    return {
        effectData: {
            label: game.hm3.enums.Condition.UNCONSCIOUS,
            token,
            icon: CONFIG.statusEffects.find((e) => e.id === 'unconscious').img, // UNCONSCIOUS_ICON
            type: 'GameTime',
            seconds: game.hm3.macros.d6(2) * MINUTE, // 2d6 minutes
            flags: {
                effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}, onDisable: {script: ON_DISABLE_MACRO}}
            }
        },
        changes: [],
        options: {unique: true}
    };
}
