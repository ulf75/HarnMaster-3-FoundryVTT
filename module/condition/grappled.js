const GRAPPLED_ICON = 'systems/hm3/images/icons/svg/manacles.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

/**
 *
 * @param {Token} token
 * @returns
 */
export async function createGrappledCondition(token) {
    if (!token) return;

    return {
        effectData: {
            label: game.hm3.enums.Condition.GRAPPLED,
            token,
            icon: GRAPPLED_ICON,
            type: 'GameTime',
            seconds: INDEFINITE
        },
        changes: [],
        options: {unique: true}
    };
}
