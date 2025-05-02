// Character selects and executes any Action Option, with a +10 bonus to EML. If the character’s
// current morale state is non-normal, it returns to normal. (COMBAT 16)
const CONDITION_ICON = 'icons/svg/upgrade.svg';
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
await token.deleteAllMoraleConditions(game.hm3.enums.Condition.EMPOWERED);
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is now <b>Empowered</b>, and adds 10 to any EML this turn.", "Combat 16");
`;

    const ON_TURN_START_MACRO = ``;

    const type = options.oneRound || options.oneTurn ? 'Combat' : 'GameTime';
    const seconds = type === 'GameTime' ? INDEFINITE : undefined;
    const rounds = type === 'Combat' && options.oneRound ? 1 : undefined;
    const turns = type === 'Combat' && options.oneTurn ? 1 : undefined;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: game.hm3.enums.Condition.EMPOWERED,
            rounds,
            seconds,
            token,
            turns,
            type,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}}}
        },
        changes: [{key: 'eph.meleeAMLMod', mode: 2, priority: null, value: '10'}], // TODO must be a general bonus on ALL skills
        options: {selfDestroy: true, unique: true}
    };
}
