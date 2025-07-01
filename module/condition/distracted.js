const CONDITION_ICON = 'systems/hm3/images/icons/svg/distraction-white.svg';

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
    if (!token) return;

    const CONDITION = game.hm3.Condition.DISTRACTED;
    console.info(`HM3 | Creating condition: ${CONDITION} for token: ${token.name}`, options);

    const uuid = foundry.utils.randomID();

    const ON_TURN_START_MACRO = options.oneRound
        ? ``
        : `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) {
    await game.hm3.GmSays({
        text:
            '<b>' +
            token.name +
            '</b> remains <b>Distracted</b> and <b>Must</b> take the <b>Pass</b> action. All Defense actions suffer a -10 penalty to EML. <b>Turn ends.</b>',
        source: 'House Rule',
        gmonly: !token.player,
        token
    });
    await token.turnEnds();
}
`;

    const type = options.oneRound || options.oneTurn ? 'Combat' : 'GameTime';
    const seconds = type === 'GameTime' ? game.hm3.CONST.TIME.INDEFINITE : undefined;
    const rounds = type === 'Combat' && options.oneRound ? 1 : undefined;
    const turns = type === 'Combat' && options.oneTurn ? 1 : undefined;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: CONDITION,
            rounds,
            seconds,
            token,
            turns,
            type,
            flags: {
                effectmacro: {onTurnStart: {script: ON_TURN_START_MACRO}},
                hm3: {uuid}
            }
        },
        changes: [{key: 'eph.meleeDMLMod', mode: 2, priority: null, value: '-10'}],
        options: {selfDestroy: true, unique: true}
    };
}
