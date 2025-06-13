const CONDITION_ICON = 'icons/svg/lightning.svg';

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

    const CONDITION = game.hm3.Condition.SHOCKED;
    console.info(`HM3 | Creating condition: ${CONDITION} for token: ${token.name}`, options);

    const uuid = foundry.utils.randomID();

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const dateTime = SimpleCalendar?.api?.currentDateTimeDisplay();
await game.hm3.macros.createInjury({token, name: 'Shock', subType: 'shock', healRate: 4, notes: 'Started: ' + dateTime?.date + ' - ' + dateTime?.time});
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) {
    if (game.combat?.started && !token.player) await token.combatant.update({defeated: true});
    const turnEnds = game.combat?.started && game.combat.combatant.id === token.combatant.id;
    if (turnEnds) {
        await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Shock</b> and displays a variety of symptoms including pallor, cold sweats, weakness, nausea, thirst, and groaning. <b>" + token.name + "</b> is incoherent and gazes helplessly at the injuries. <b>Turn Ends.</b>", "Combat 14");
        await token.turnEnds();
    } else {
        await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Shock</b> and displays a variety of symptoms including pallor, cold sweats, weakness, nausea, thirst, and groaning. <b>" + token.name + "</b> is incoherent and gazes helplessly at the injuries.", "Combat 14");
    }
}
console.info("HM3 | Condition: ${CONDITION} created for token: ${token.name}");
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
if (!token) return;
const unconscious = token.hasCondition(game.hm3.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Shock</b>. Shock prevents the use of skills, spells, and psionic talents. In a combat situation, a character in <b>Shock</b> may Rest, Walk/Crawl (at half move), or be led away; the character will <b>Ignore</b> any attacks.", "Combat 18");
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
            seconds: game.hm3.CONST.TIME.INDEFINITE,
            token,
            type: 'GameTime',
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
        options: {
            overlay: !(token.hasCondition(game.hm3.Condition.DYING) || token.hasCondition(game.hm3.Condition.UNCONSCIOUS)),
            unique: true
        }
    };
}
