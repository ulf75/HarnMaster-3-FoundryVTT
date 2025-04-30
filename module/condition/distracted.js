const CONDITION_ICON = 'icons/svg/daze.svg';
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
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) {
    await game.hm3.GmSays("<b>" + token.name + "</b> remains <b>Distracted</b> and <b>Must</b> take the <b>Pass</b> action. All Defense actions suffer a -10 penalty to EML. <b>Turn ends.</b>", "House Rule");
    await game.combats.active.nextTurn(500); // delay so that other hooks are executed first
}`;

    return {
        effectData: {
            label: game.hm3.enums.Condition.DISTRACTED,
            token,
            icon: CONDITION_ICON,
            type: 'GameTime',
            seconds: INDEFINITE,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}}}
        },
        changes: [{key: 'eph.meleeDMLMod', mode: 2, priority: null, value: '-10'}],
        options: {unique: true}
    };
}
