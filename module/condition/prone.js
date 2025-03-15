const PRONE = 'Prone';
const PRONE_ICON = 'systems/hm3/images/icons/svg/falling.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

/**
 *
 * @param {Token} token
 * @returns
 */
export async function createProneCondition(token) {
    if (!token) return;

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> falls prone, and getting up takes one action. <b>All</b> opponents gain +20 on <b>All</b> attack and defense rolls.", "Combat 11");
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (unconscious) return;
const PRONE = '${PRONE}';
const PRONE_IMG = '${PRONE_ICON}';
await Requestor.request({
    title: PRONE,
    description:
        '<div class="chat-card fluff"><p>You are still lying on the floor. Getting up takes <b>one action</b>.</p><p>If you remain on the ground, <b>all</b> opponents gain +20 on <b>all</b> attack and defense rolls against you.</p></div>',
    img: PRONE_IMG,
    limit: Requestor.LIMIT.OPTION,
    buttonData: [
        {
            label: 'Rise',
            command: async function () {
                const effect = game.hm3.macros.getActiveEffect(canvas.tokens.get('${token.id}'), '${PRONE}', true);
                if (effect) {
                    effect.delete();
                    await game.hm3.GmSays("<b>" + token.name + "</b> successfully rises from the ground. <b>Turn ends.</b>", "Combat 11");
                    await game.combats.active.nextTurn(1000); // delay so that other hooks are executed first
                }
            },
            scope: {PRONE: PRONE}
        },
        {
            label: 'Ignore',
            command: async function () {
                await game.hm3.GmSays("Ok, " + token.name + " remains lying on the floor.", "Combat 11");
            }
        }
    ]
});
`;

    return {
        effectData: {
            label: PRONE,
            token,
            icon: PRONE_ICON,
            type: 'GameTime',
            seconds: INDEFINITE,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}}}
        },
        changes: [],
        options: {unique: true}
    };
}
