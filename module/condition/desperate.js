// Character tries to conclude the battle, one way or the other, as soon as possible. Until
// the situation changes and a new Initiative Test is passed, the character selects the most
// aggressive option available. (COMBAT 16)
const CONDITION_ICON = 'systems/hm3/images/icons/svg/distraction-white.svg';

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
    if (!token) return false;

    // Inanimate creatures are immune to morale conditions
    if (token.hasCondition(game.hm3.Condition.INANIMATE)) return false;

    const CONDITION = game.hm3.Condition.DESPERATE;
    console.info(`HM3 | Creating condition: ${CONDITION} for token: ${token.name}`, options);

    const uuid = foundry.utils.randomID();

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
await token.deleteAllMoraleConditions(game.hm3.Condition.DESPERATE);
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is now <b>Desperate</b>, and tries to conclude the battle, one way or the other, as soon as possible. Until the situation changes and a new Initiative Test is passed, the character selects the <b>Most Aggressive</b> option available.", "Combat 16", !token.player);
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is still <b>Desperate</b>, and tries to conclude the battle, one way or the other, as soon as possible. Until the situation changes and a new Initiative Test is passed, the character selects the <b>Most Aggressive</b> option available.", "Combat 16", !token.player);
`;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: CONDITION,
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            token,
            type: 'GameTime',
            flags: {
                effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}},
                hm3: {uuid}
            }
        },
        changes: [],
        options: {unique: true}
    };
}
