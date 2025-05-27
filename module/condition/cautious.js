// A cautious character will not Engage, must choose Pass if engaged, and cannot select the
// Counterstrike defense. (COMBAT 16)
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
    if (!token) return;

    const CONDITION = game.hm3.Condition.CAUTIOUS;
    console.info(`HM3 | Creating condition: ${CONDITION} for token: ${token.name}`, options);

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
await token.deleteAllMoraleConditions('${CONDITION}');
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) {
    await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is now <b>Cautious</b>, and will not Engage, must choose <b>Pass</b> if engaged, and cannot select the Counterstrike defense.", "Combat 16");
    if (token.isEngaged()) {
        await game.hm3.GmSays("<b>" + token.name + "</b> is <b>Cautious</b>, and must choose <b>Pass</b> if engaged. <b>Turn ends.</b>", "Combat 16");
        token.turnEnds();
    }
}
game.hm3.resolveMap.get('${token.id + CONDITION}')(true);
`;

    const ON_TURN_START_MACRO = options.oneRound
        ? ''
        : `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) {
    await game.hm3.Gm2GmSays("<b>" + token.name + "</b> is still <b>Cautious</b>, and will not Engage, must choose <b>Pass</b> if engaged, and cannot select the Counterstrike defense.", "Combat 16");
    if (token.isEngaged()) {
        token.turnEnds();
        await game.hm3.GmSays("<b>" + token.name + "</b> is <b>Cautious</b>, and must choose <b>Pass</b> if engaged. <b>Turn ends.</b>", "Combat 16");
    }
}`;

    const type = options.oneRound || options.oneTurn ? 'Combat' : 'GameTime';
    const seconds = type === 'GameTime' ? game.hm3.CONST.TIME.INDEFINITE : undefined;
    const rounds = type === 'Combat' && options.oneRound ? 1 : undefined;
    const turns = type === 'Combat' && options.oneTurn ? 1 : undefined;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: CONDITION,
            rounds,
            seconds,
            token,
            turns,
            type,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}}}
        },
        changes: [],
        options: {selfDestroy: true, unique: true}
    };
}
