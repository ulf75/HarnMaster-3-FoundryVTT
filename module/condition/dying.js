const CONDITION_ICON = 'icons/svg/skull.svg';

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

    const CONDITION = game.hm3.Condition.DYING;
    console.info(`HM3 | Creating condition: ${CONDITION} for token: ${token.name}`, options);

    const uuid = foundry.utils.randomID();

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
await token.deleteAllMoraleConditions();
await token.combatant?.update({defeated: true});
await token.addCondition(game.hm3.Condition.UNCONSCIOUS);
if (!!token.actor.player) {
    await game.hm3.GmSays("<b>" + token.name + "</b> is <b>unconscious</b> due to a <b>Mortal Wound</b> and is <b>Dying</b>. Life-saving measures should be initiated as quickly as possible.", "Combat 14");
} else {
    await game.hm3.GmSays("<b>" + token.name + "</b> is <b>Dead</b> due to a <b>Mortal Wound</b>.", "Combat 14");
}
console.info("HM3 | Condition: ${CONDITION} created for token: ${token.name}");
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
await game.hm3.GmSays("<b>" + token.name + "</b> stays unconscious due to a <b>Mortal Wound</b>. <b>Turn ends.</b>", "Combat 14");
await token.turnEnds();
`;

    const ON_DELETE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
game.hm3.macros.updateOverlay(token);
console.info("HM3 | Condition: ${CONDITION} deleted for token: ${token.name}");
`;

    return {
        effectData: {
            icon: CONDITION_ICON,
            label: CONDITION,
            token,
            type: 'GameTime',
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            flags: {
                effectmacro: {
                    onCreate: {script: ON_CREATE_MACRO},
                    onTurnStart: {script: ON_TURN_START_MACRO},
                    onDelete: {script: ON_DELETE_MACRO}
                },
                hm3: {uuid}
            }
        },
        changes: [],
        options: {overlay: true, unique: true}
    };
}
