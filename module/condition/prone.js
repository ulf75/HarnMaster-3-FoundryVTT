const PRONE = 'Prone';
const PRONE_ICON = 'systems/hm3/images/icons/svg/falling.svg';
const UNCONSCIOUS = 'Unconscious';

/**
 *
 * @param {Token} token
 * @returns
 */
export async function createProneCondition(token) {
    if (!token) return;

    const ON_CREATE_MACRO = `const token = canvas.tokens.get('${token.id}');
console.log('HM3 | Combatant ' + token.name + ' falls prone.');
if (game.hm3.macros.hasActiveEffect(canvas.tokens.get('${token.id}'), '${UNCONSCIOUS}', true)) return;
await ChatMessage.create({
    speaker,
    content:
        "<p>You're lying on the floor. Getting up takes <b>one action</b>.</p><p><b>All</b> opponents gain +20 on <b>all</b> attack and defence rolls against you.</p>"
});`;

    const ON_TURN_START_MACRO = `if (game.hm3.macros.hasActiveEffect(canvas.tokens.get('${token.id}'), '${UNCONSCIOUS}', true)) return;
const PRONE = '${PRONE}';
const PRONE_IMG = '${PRONE_ICON}';
await Requestor.request({
    title: PRONE,
    description:
        "<p>You're still lying on the floor. Getting up takes <b>one action</b>.</p><p>If you remain on the ground, <b>all</b> opponents gain +20 on <b>all</b> attack and defence rolls against you.</p>",
    img: PRONE_IMG,
    limit: Requestor.LIMIT.OPTION,
    buttonData: [
        {
            label: 'Rise',
            command: async function () {
                const effect = game.hm3.macros.getActiveEffect(canvas.tokens.get('${token.id}'), '${PRONE}', true);
                if (effect) {
                    effect.delete();
                    await ChatMessage.create({
                        speaker,
                        content: 'You got up successfully.'
                    });
                }
            },
            scope: {PRONE: PRONE, speaker: speaker}
        },
        {
            label: 'Ignore',
            command: async function () {
                await ChatMessage.create({
                    speaker,
                    content: 'Ok, you remain lying on the floor.'
                });
            },
            scope: {speaker: speaker}
        }
    ]
});`;

    return {
        effectData: {
            label: PRONE,
            token,
            icon: PRONE_ICON,
            type: 'GameTime',
            seconds: null,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}}}
        },
        changes: [],
        options: {unique: true}
    };
}
