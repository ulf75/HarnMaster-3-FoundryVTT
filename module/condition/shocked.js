const SHOCKED = 'Shocked';
const SHOCKED_ICON = 'systems/hm3/images/icons/svg/shock.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

/**
 *
 * @param {Token} token
 * @returns
 */
export async function createShockedCondition(token) {
    if (!token) return;

    return {
        effectData: {
            label: SHOCKED,
            token,
            icon: SHOCKED_ICON,
            type: 'GameTime',
            seconds: INDEFINITE // 4 * 60 * 60 // 4 hours
        },
        changes: [],
        options: {unique: true}
    };
}
