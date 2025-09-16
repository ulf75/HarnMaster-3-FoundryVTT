const CONDITION_ICON = 'systems/hm3/images/icons/svg/skeleton-white.svg';

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

    const CONDITION = game.hm3.Condition.INANIMATE;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: CONDITION,
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            token,
            type: 'GameTime'
        },
        changes: [
            {key: 'v2.fatiguePenalty', mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: null, value: `0`},
            {key: 'v2.injuryPenalty', mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: null, value: `0`}
        ],
        options: {hidden: true, unique: true}
    };
}
