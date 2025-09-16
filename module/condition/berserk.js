// This is a special state of battle frenzy. Any character who enters this mode must take the most
// aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike.
// Further Initiative rolls are ignored until the battle ends. (COMBAT 16)
const CONDITION_ICON = 'systems/hm3/images/icons/svg/enrage-white.svg';

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

    const CONDITION = game.hm3.Condition.BERSERK;
    console.info(`HM3 | Creating condition: ${CONDITION} for token: ${token.name}`, options);

    const uuid = foundry.utils.randomID();

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
await token.deleteAllMoraleConditions('${CONDITION}');
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> enters <b>Berserk Mode</b>, and <b>Must</b> take the most aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike. Further Initiative rolls are ignored until the battle ends.", "Combat 18");
console.info("HM3 | Condition: ${CONDITION} created for token: ${token.name}");
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is in <b>Berserk Mode</b>, and <b>Must</b> take the most aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike. Further Initiative rolls are ignored until the battle ends.", "Combat 18");
`;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: CONDITION,
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            token,
            type: 'GameTime',
            flags: {
                effectmacro: {
                    onCreate: {script: ON_CREATE_MACRO},
                    onTurnStart: {script: ON_TURN_START_MACRO}
                },
                hm3: {uuid}
            }
        },
        changes: [{key: 'v2.meleeAMLMod', mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: null, value: '20'}],
        options: {unique: true}
    };
}
