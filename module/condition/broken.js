// The character is unable to fight in any useful way. The only available options are flight or
// surrender. Flight is normally preferable; surrender is a last resort. If neither is feasible,
// the character makes a Rest or Pass action option, but can defend if attacked except that
// Counterstrike is prohibited. (COMBAT 16)
const CONDITION_ICON = 'icons/svg/downgrade.svg';
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
await token.deleteAllMoraleConditions(game.hm3.enums.Condition.BROKEN);
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is now <b>Broken</b>, and is unable to fight in any useful way. The only available options are flight or surrender. Flight is normally preferable; surrender is a last resort.", "Combat 16");
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is still <b>Broken</b>, and is unable to fight in any useful way. The only available options are flight or surrender. Flight is normally preferable; surrender is a last resort.", "Combat 16");
`;

    return {
        effectData: {
            label: game.hm3.enums.Condition.BROKEN,
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
