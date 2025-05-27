// const SHOCKED_ICON = 'systems/hm3/images/icons/svg/shock.svg';
const CONDITION_ICON = 'icons/svg/lightning.svg';

const ON_CREATE_MACRO = (token) => `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const dateTime = SimpleCalendar?.api?.currentDateTimeDisplay();
await game.hm3.macros.createInjury({token, name: 'Shock', subType: 'shock', healRate: 4, notes: 'Started: ' + dateTime?.date + ' - ' + dateTime?.time});
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) {
    await token.actor.toggleStatusEffect('shock', {active: true, overlay: true});
    if (!token.player) await token.combatant.update({defeated: true});
    const turnEnds = game.combat?.started && game.combat.combatant.id === token.combatant.id;
    if (turnEnds) {
        await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Shock</b> and displays a variety of symptoms including pallor, cold sweats, weakness, nausea, thirst, and groaning. <b>" + token.name + "</b> is incoherent and gazes helplessly at the injuries. <b>Turn Ends.</b>", "Combat 14");
        token.turnEnds();
    } else {
        await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Shock</b> and displays a variety of symptoms including pallor, cold sweats, weakness, nausea, thirst, and groaning. <b>" + token.name + "</b> is incoherent and gazes helplessly at the injuries.", "Combat 14");
    }
}
console.info("HM3 | Condition: ${game.hm3.Condition.SHOCKED} created for token: ${token.name}");
game.hm3.resolveMap.get('${token.id + game.hm3.Condition.SHOCKED}')(true);
`;

const ON_TURN_START_MACRO = (token) => `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Shock</b>. Shock prevents the use of skills, spells, and psionic talents. In a combat situation, a character in <b>Shock</b> may Rest, Walk/Crawl (at half move), or be led away; the character will <b>Ignore</b> any attacks.", "Combat 18");
`;

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
    console.info(`HM3 | Creating condition: ${game.hm3.Condition.SHOCKED} for token: ${token.name}`, options);

    return {
        effectData: {
            label: game.hm3.Condition.SHOCKED,
            token,
            icon: CONDITION_ICON,
            type: 'GameTime',
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO(token)}, onTurnStart: {script: ON_TURN_START_MACRO(token)}}}
        },
        changes: [],
        options: {unique: true}
    };
}
