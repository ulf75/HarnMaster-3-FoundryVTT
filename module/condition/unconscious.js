const UNCONSCIOUS = 'Unconscious';
const UNCONSCIOUS_ICON = 'systems/hm3/images/icons/svg/shock.svg';
const SHOCKED = 'Shocked';

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
  content: '<div class="chat-card"><p class="fluff">You faint from pain, bloodloss and exertion on your occupied field.</p></div>',
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
await ChatMessage.create({
    speaker,
    content: '<div class="chat-card"><p class="fluff">You need a successful shock roll to regain consciousness.</p></div>'
});
const success = (await game.hm3.macros.shockRoll(false, token.actor)).isSuccess;
if (success) {
    // Combatant regains consciousness
    console.log('HM3 | Combatant ' + token.name + ' regains consciousness.');
    await ChatMessage.create({
        speaker,
        content: '<div class="chat-card"><p class="fluff">You regain consciousness!</p><p class="fluff">You are coming back to your senses, but are you stable?</p></div>'
    });
    const ok = (await game.hm3.macros.shockRoll(false, token.actor)).isSuccess;
    await token.actor.effects.get('${effect.id}').delete();
    if (ok) {
        // Combatant is back
        console.log('HM3 | Combatant ' + token.name + ' is back.');
        await ChatMessage.create({
            speaker,
            content: '<div class="chat-card"><p class="fluff">You are back and function normally.</p></div>'
        });
    } else {
        // Combatant is now SHOCKED
        console.log('HM3 | Combatant ' + token.name + ' is now SHOCKED.');
        await game.hm3.macros.createCondition(token, '${SHOCKED}');
        await ChatMessage.create({
            speaker,
            content:
                '<div class="chat-card"><p class="fluff">You are in <b>SHOCK</b> and display a variety of symptoms including pallor, cold sweats, weakness, nausea, thirst, and groaning. You are incoherent and gaze helplessly at your injuries.</p></div>'
        });
    }
} else {
    // Combatant stays unconscious
    console.log('HM3 | Combatant ' + token.name + ' stays unconscious.');
    await ChatMessage.create({
        speaker,
        content: '<div class="chat-card"><p class="fluff">You stay unconscious.</p></div>'
    });
}`;
}
