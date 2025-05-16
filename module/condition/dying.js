// const DYING_ICON = 'systems/hm3/images/icons/svg/daemon-skull.svg';
const CONDITION_ICON = 'icons/svg/skull.svg';
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
if (!token) return;
await token.deleteAllMoraleConditions();
await token.actor.toggleStatusEffect('dead', {active: true, overlay: true});
await token.combatant.update({defeated: true});
await token.addCondition(game.hm3.Condition.UNCONSCIOUS);
if (!!token.actor.player) {
    await game.hm3.GmSays("<b>" + token.name + "</b> is <b>unconscious</b> due to a <b>Mortal Wound</b> and is <b>Dying</b>. Life-saving measures should be initiated as quickly as possible.", "Combat 14");
} else {
    await game.hm3.GmSays("<b>" + token.name + "</b> is <b>Dead</b> due to a <b>Mortal Wound</b>.", "Combat 14");
}`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
await game.hm3.GmSays("<b>" + token.name + "</b> stays unconscious due to a <b>Mortal Wound</b>. <b>Turn ends.</b>", "Combat 14");
token.turnEnds();
`;

    return {
        effectData: {
            label: game.hm3.Condition.DYING,
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
