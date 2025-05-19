// const GRAPPLED_ICON = 'systems/hm3/images/icons/svg/manacles.svg';
const GRAPPLED_ICON = 'icons/svg/net.svg';

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

    return {
        effectData: {
            label: game.hm3.Condition.GRAPPLED,
            token,
            icon: GRAPPLED_ICON,
            type: 'GameTime',
            seconds: game.hm3.CONST.TIME.INDEFINITE
        },
        changes: [],
        options: {unique: true}
    };
}
