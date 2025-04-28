// A cautious character will not Engage, must choose Pass if engaged, and cannot select the
// Counterstrike defense. (COMBAT 16)
const CONDITION_ICON = 'systems/hm3/images/icons/svg/distraction.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

/**
 *
 * @param {HarnMasterToken} token
 * @param {Object} [options={}] - Options for the condition
 * @param {boolean} [options.oneRoll=false] - Only one roll defaults to false
 * @param {boolean} [options.oneRound=false] - Only one round defaults to false
 * @param {boolean} [options.oneTurn=false] - Only one turn defaults to false
 * @returns
 */
export async function createCondition(token, options = {}) {
    if (!token) return;

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
await token.deleteAllMoraleConditions(game.hm3.enums.Condition.CAUTIOUS);
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is now <b>Cautious</b>, and will not Engage, must choose <b>Pass</b> if engaged, and cannot select the Counterstrike defense.", "Combat 16");
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is still <b>Cautious</b>, and will not Engage, must choose <b>Pass</b> if engaged, and cannot select the Counterstrike defense.", "Combat 16");
`;

    return {
        effectData: {
            label: game.hm3.enums.Condition.CAUTIOUS,
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
