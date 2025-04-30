// This is a special state of battle frenzy. Any character who enters this mode must take the most
// aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike.
// Further Initiative rolls are ignored until the battle ends. (COMBAT 16)
const CONDITION_ICON = 'systems/hm3/images/icons/svg/enrage.svg';
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
await token.deleteAllMoraleConditions(game.hm3.enums.Condition.BERSERK);
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> enters <b>Berserk Mode</b>, and <b>Must</b> take the most aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike. Further Initiative rolls are ignored until the battle ends.", "Combat 18");
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is in <b>Berserk Mode</b>, and <b>Must</b> take the most aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike. Further Initiative rolls are ignored until the battle ends.", "Combat 18");
`;

    return {
        effectData: {
            label: game.hm3.enums.Condition.BERSERK,
            token,
            icon: CONDITION_ICON,
            type: 'GameTime',
            seconds: INDEFINITE,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}}}
        },
        changes: [{key: 'eph.meleeAMLMod', mode: 2, priority: null, value: '20'}],
        options: {unique: true}
    };
}
