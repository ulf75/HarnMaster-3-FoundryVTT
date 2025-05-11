// A character is outnumbered if exclusively engaged by two or more opponents. When counting
// opponents for this purpose, prone enemies are excluded, as are enemies who are themselves
// engaged by other friendly characters. (COMBAT 11)
const CONDITION_ICON = 'systems/hm3/images/icons/svg/backup-white.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

/**
 *
 * @param {HarnMasterToken} token
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

    const label = `${game.hm3.Condition.OUTNUMBERED} ${options.outnumbered}:1`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is <b>${label}</b>, and gets -${
        (options.outnumbered - 1) * 10
    } on <b>All</b> defense rolls including counterattack.", "Combat 11");
`;

    return {
        effectData: {
            label,
            token,
            icon: CONDITION_ICON,
            type: 'GameTime',
            seconds: INDEFINITE,
            flags: {effectmacro: {onTurnStart: {script: ON_TURN_START_MACRO}}}
        },
        changes: [{key: 'eph.outnumbered', mode: 2, priority: null, value: `${options.outnumbered}`}],
        options: {unique: true}
    };
}
