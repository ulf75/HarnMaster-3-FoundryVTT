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

    const CONDITION = game.hm3.Condition.INSENSATE;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: CONDITION,
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            token,
            type: 'GameTime'
        },
        changes: [
            {key: 'eph.fatigue', mode: 2, priority: null, value: `-100`},
            {key: 'eph.totalInjuryLevels', mode: 2, priority: null, value: `-100`}
        ],
        options: {hidden: true, unique: true}
    };
}
