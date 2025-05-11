// Character tries to conclude the battle, one way or the other, as soon as possible. Until
// the situation changes and a new Initiative Test is passed, the character selects the most
// aggressive option available. (COMBAT 16)
const CONDITION_ICON = 'systems/hm3/images/icons/svg/distraction-white.svg';
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

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
await token.deleteAllMoraleConditions(game.hm3.Condition.DESPERATE);
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is now <b>Desperate</b>, and tries to conclude the battle, one way or the other, as soon as possible. Until the situation changes and a new Initiative Test is passed, the character selects the <b>Most Aggressive</b> option available.", "Combat 16");
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is still <b>Desperate</b>, and tries to conclude the battle, one way or the other, as soon as possible. Until the situation changes and a new Initiative Test is passed, the character selects the <b>Most Aggressive</b> option available.", "Combat 16");
`;

    return {
        effectData: {
            label: game.hm3.Condition.DESPERATE,
            token,
            icon: CONDITION_ICON,
            type: 'GameTime',
            seconds: INDEFINITE,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}}}
        },
        changes: [],
        options: {unique: true}
    };
}
