// const PRONE_ICON = 'systems/hm3/images/icons/svg/falling.svg';
const CONDITION_ICON = 'icons/svg/falling.svg';

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

    if (token.hasCondition(game.hm3.Condition.NO_STUMBLE)) return false;

    const CONDITION = game.hm3.Condition.PRONE;
    console.info(`HM3 | Creating condition: ${CONDITION} for token: ${token.name}`, options);

    const uuid = foundry.utils.randomID();

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
await token.document.setFlag('wall-height', 'tokenHeight', 2);
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious)
    await game.hm3.GmSays({
        text:
            '<b>' +
            token.name +
            '</b> falls prone, and getting up takes one action. <b>All</b> opponents gain +20 on <b>All</b> attack and defense rolls.',
        source: 'Combat 11'
    });
console.info('HM3 | Condition: ${CONDITION} created for token: ${token.name}');
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const distracted = token.hasCondition(game.hm3.Condition.DISTRACTED);
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (distracted || unconscious) return;
const PRONE_IMG = '${CONDITION_ICON}';
await game.hm3.GmSays({
    text:
        '<b>' + token.name + '</b> is prone, and <b>All</b> opponents gain +20 on <b>All</b> attack and defense rolls.',
    source: 'Combat 11',
    gmonly: !token.player
});
await Requestor.request({
    title: game.hm3.Condition.PRONE,
    description: '<div class="chat-card fluff"><p>Getting up takes <b>ONE Action</b>.</p></div>',
    img: PRONE_IMG,
    limit: Requestor.LIMIT.OPTION,
    speaker: ChatMessage.getSpeaker({token}),
    buttonData: [
        {
            label: 'Rise',
            command: async function () {
                const token = canvas.tokens.get('${token.id}');
                await token.deleteCondition(game.hm3.Condition.PRONE);
            }
        },
        {
            label: 'Ignore',
            command: async function () {
                const token = canvas.tokens.get('${token.id}');
                await game.hm3.GmSays({
                    text: 'Ok, ' + token.name + ' remains lying on the floor.',
                    source: 'Combat 11',
                    gmonly: !token.player
                });
            }
        }
    ]
});
`;

    const ON_DELETE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
await token.document.setFlag('wall-height', 'tokenHeight', token.actor.system.height | 6);
if (game.combat?.started && game.combat.combatant) {
    if (game.combat.combatant.id === token.combatant?.id) {
        await game.hm3.GmSays({
            text: '<b>' + token.name + '</b> rises successfully. <b>Turn ends.</b>',
            source: 'Combat 11',
            token
        });
        await token.turnEnds();
    } else {
        await game.hm3.GmSays({text: '<b>' + token.name + '</b> rises successfully.', source: 'Combat 11', token});
    }
}
game.hm3.macros.updateOverlay(token);
console.info('HM3 | Condition: ${CONDITION} deleted for token: ${token.name}');
`;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: CONDITION,
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            token,
            type: 'GameTime',
            flags: {
                effectmacro: {
                    onCreate: {script: ON_CREATE_MACRO},
                    onTurnStart: {script: ON_TURN_START_MACRO},
                    onDelete: {script: ON_DELETE_MACRO}
                },
                hm3: {uuid}
            }
        },
        changes: [],
        options: {
            overlay: !(
                token.hasCondition(game.hm3.Condition.DYING) ||
                token.hasCondition(game.hm3.Condition.UNCONSCIOUS) ||
                token.hasCondition(game.hm3.Condition.SHOCKED)
            ),
            unique: true
        }
    };
}
