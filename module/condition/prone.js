// const PRONE_ICON = 'systems/hm3/images/icons/svg/falling.svg';
const PRONE_ICON = 'icons/svg/falling.svg';
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
token.document.setFlag('wall-height', 'tokenHeight', 2);
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> falls prone, and getting up takes one action. <b>All</b> opponents gain +20 on <b>All</b> attack and defense rolls.", "Combat 11");
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (unconscious) return;
const PRONE_IMG = '${PRONE_ICON}';
await game.hm3.GmSays("<b>" + token.name + "</b> is prone, and <b>All</b> opponents gain +20 on <b>All</b> attack and defense rolls.", "Combat 11");
await Requestor.request({
    title: game.hm3.enums.Condition.PRONE,
    description:
        '<div class="chat-card fluff"><p>Getting up takes <b>ONE Action</b>.</p></div>',
    img: PRONE_IMG,
    limit: Requestor.LIMIT.OPTION,
    speaker: ChatMessage.getSpeaker({token}),
    buttonData: [
        {
            label: 'Rise',
            command: async function () {
                const token = canvas.tokens.get('${token.id}');
                token.getCondition(game.hm3.enums.Condition.PRONE)?.delete();
            }
        },
        {
            label: 'Ignore',
            command: async function () {
                const token = canvas.tokens.get('${token.id}');
                await game.hm3.GmSays("Ok, " + token.name + " remains lying on the floor.", "Combat 11");
            }
        }
    ]
});
`;

    const ON_DELETE_MACRO = `
const token = canvas.tokens.get('${token.id}');
await game.hm3.GmSays("<b>" + token.name + "</b> rises successfully. <b>Turn ends.</b>", "Combat 11");
await token.document.setFlag('wall-height', 'tokenHeight', token.actor.system.height | 6);
await game.combats.active.nextTurn(500); // delay so that other hooks are executed first
`;

    return {
        effectData: {
            label: game.hm3.enums.Condition.PRONE,
            token,
            icon: PRONE_ICON,
            type: 'GameTime',
            seconds: INDEFINITE,
            flags: {
                effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}, onDelete: {script: ON_DELETE_MACRO}}
            }
        },
        changes: [],
        options: {unique: true}
    };
}
