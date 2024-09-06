const UNCONSCIOUS = 'Unconscious';
const UNCONSCIOUS_ICON = 'systems/hm3/images/icons/svg/shock.svg';

function d6() {
    return Math.floor(6 * foundry.dice.MersenneTwister.random()) + 1;
}

/**
 *
 * @param {Token} token
 * @returns
 */
export async function createUnconsciousCondition(token) {
    if (!token) return;

    const ON_CREATE_MACRO = `const token = canvas.tokens.get('${token.id}');
console.log('HM3 | Combatant ' + token.name + ' fails the SHOCK roll and gets unconscious.');
await ChatMessage.create({
  speaker,
  content: "<p>You faint from pain and exertion on your occupied field.</p>",
});`;

    // On deletion (regain consciousness), make a last SHOCK roll (SKILLS 22, COMBAT 14)
    const ON_DELETE_MACRO = `const token = canvas.tokens.get('${token.id}');
console.log('HM3 | Combatant ' + token.name + ' makes a last SHOCK roll.');`;

    return {
        effectData: {
            label: UNCONSCIOUS,
            token,
            icon: UNCONSCIOUS_ICON,
            type: 'GameTime',
            seconds: (d6() + d6()) * 60, // 2d6 minutes
            flags: {
                effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onDelete: {script: ON_DELETE_MACRO}}
            }
        },
        changes: [],
        options: {selfDestroy: true, unique: true}
    };
}

export function getOnTurnStartMacro(token, effect) {
    // If in combat, make a SHOCK roll each turn (SKILLS 22, COMBAT 14)
    return `const token = canvas.tokens.get('${token.id}');
console.log('HM3 | Combatant ' + token.name + ' makes a SHOCK roll to regain consciousness.');
const success = true;
if (success) {
    // regain consciousness
    console.log('HM3 | Combatant ' + token.name + ' regains consciousness.');
    await token.actor.effects.get('${effect.id}').delete();
    await ChatMessage.create({
        speaker,
        content: '<p>You regain consciousness!</p><p>Are you coming back to your senses, but are you stable?</p>'
    });
}`;
}
