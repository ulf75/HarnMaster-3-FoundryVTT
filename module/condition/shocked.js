const SHOCKED = 'Shocked';
const SHOCKED_ICON = 'systems/hm3/images/icons/svg/shock.svg';

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
            seconds: null
        },
        changes: [],
        options: {unique: true}
    };
}
