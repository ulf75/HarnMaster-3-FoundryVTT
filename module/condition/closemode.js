const CONDITION_ICON = 'systems/hm3/images/icons/svg/spiked-wall-white.svg';

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

    const CONDITION = game.hm3.Condition.CLOSE_MODE;
    console.info(`HM3 | Creating condition: ${CONDITION} for token: ${token.name}`, options);

    const uuid = foundry.utils.randomID();

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious)
    await game.hm3.GmSays({
        text:
            '<b>' +
            token.name +
            '</b> is in <b>Close Mode</b>, and gets -10 on <b>All</b> attack rolls. Any <b>Thrusting Weapon</b> (such as a Spear, or a Sword employing Point aspect) ignore Close Mode modifiers.',
        source: 'Combat 11',
        gmonly: !token.player
    });
`;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: CONDITION,
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            token,
            type: 'GameTime',
            flags: {
                effectmacro: {onTurnStart: {script: ON_TURN_START_MACRO}},
                hm3: {uuid}
            }
        },
        changes: [],
        options: {unique: true}
    };
}
