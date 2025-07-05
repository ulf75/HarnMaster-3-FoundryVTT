// A character is outnumbered if exclusively engaged by two or more opponents. When counting
// opponents for this purpose, prone enemies are excluded, as are enemies who are themselves
// engaged by other friendly characters. (COMBAT 11)
const CONDITION_ICON = 'systems/hm3/images/icons/svg/backup-white.svg';

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
    if ((options?.outnumbered || 1) < 2) return;
    if (token.hasCondition(game.hm3.Condition.NO_OUTNUMBERED)) return false;

    const CONDITION = game.hm3.Condition.OUTNUMBERED;
    const label = `${CONDITION} ${options.outnumbered}:1`;
    console.info(`HM3 | Creating condition: ${label} for token: ${token.name}`, options);

    const uuid = foundry.utils.randomID();

    const ON_CREATE_MACRO = ``;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious)
    await game.hm3.GmSays({
        text:
            '<b>' +
            token.name +
            '</b> is <b>${label}</b>, and gets -${
        (options.outnumbered - 1) * 10
    } on <b>All</b> defense rolls including counterattack.',
        source: 'Combat 11',
        gmonly: !token.player
    });
`;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label,
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            token,
            type: 'GameTime',
            flags: {
                effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}},
                hm3: {uuid}
            }
        },
        changes: [{key: 'eph.outnumbered', mode: 2, priority: null, value: `${options.outnumbered}`}],
        options: {unique: true}
    };
}
