const CONDITION_ICON = 'systems/hm3/images/icons/svg/no-fumble.svg';

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

    const CONDITION = game.hm3.Condition.NO_FUMBLE;
    console.info(`HM3 | Creating condition: ${CONDITION} for token: ${token.name}`, options);

    const uuid = foundry.utils.randomID();

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: CONDITION,
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            token,
            type: 'GameTime',
            flags: {
                hm3: {uuid}
            }
        },
        changes: [],
        options: {hidden: true, unique: true}
    };
}
