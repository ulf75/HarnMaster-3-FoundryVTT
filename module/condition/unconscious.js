const UNCONSCIOUS = 'Unconscious';
const UNCONSCIOUS_ICON = 'systems/hm3/images/icons/svg/shock.svg';

function d6() {
    return Math.floor(6 * foundry.dice.MersenneTwister.random()) + 1;
}

/**
 *
 * @param {Actor} actor
 * @returns
 */
export async function createUnconsciousCondition(actor) {
    if (!actor) return;

    const ON_CREATE_MACRO = `const actor = game.actors.get('${actor.id}');
console.log('HM3 | Actor ' + actor.name + ' fails the SHOCK roll and gets unconscious.');
await ChatMessage.create({
  speaker,
  content: "<p>You faint from pain and exertion on your occupied field.</p>",
});`;

    // On deletion (regain consciousness), make a last SHOCK roll (SKILLS 22, COMBAT 14)
    const ON_DELETE_MACRO = `const actor = game.actors.get('${actor.id}');
console.log('HM3 | Actor ' + actor.name + ' makes a last SHOCK roll.');`;

    return {
        effectData: {
            label: UNCONSCIOUS,
            actor,
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

export function getOnTurnStartMacro(actor, effect) {
    // If in combat, make a SHOCK roll each turn (SKILLS 22, COMBAT 14)
    return `const actor = game.actors.get('${actor.id}');
console.log('HM3 | Actor ' + actor.name + ' makes a SHOCK roll to regain consciousness.');
const success = true;
if (success) {
    // regain consciousness
    console.log('HM3 | Actor ' + actor.name + ' regains consciousness.');
    await actor.effects.get('${effect.id}').delete();
    await ChatMessage.create({
        speaker,
        content: '<p>You regain consciousness!</p><p>Are you coming back to your senses, but are you stable?</p>'
    });
}`;
}
