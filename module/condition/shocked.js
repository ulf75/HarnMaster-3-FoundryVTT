const SHOCKED_ICON = 'systems/hm3/images/icons/svg/shock.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

const ON_CREATE_MACRO = (token) => `
const token = canvas.tokens.get('${token.id}');
const dateTime = SimpleCalendar?.api?.currentDateTimeDisplay();
await game.hm3.macros.createInjury({token, name: 'Shock', subType: 'shock', healRate: 4, notes: 'Started: ' + dateTime?.date + ' - ' + dateTime?.time});
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Shock</b> and displays a variety of symptoms including pallor, cold sweats, weakness, nausea, thirst, and groaning. <b>" + token.name + "</b> is incoherent and gazes helplessly at the injuries.", "Combat 14");
`;

const ON_TURN_START_MACRO = (token) => `
const token = canvas.tokens.get('${token.id}');
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Shock</b>. Shock prevents the use of skills, spells, and psionic talents. In a combat situation, a character in <b>Shock</b> may Rest, Walk/Crawl (at half move), or be led away; the character will <b>Ignore</b> any attacks.", "Combat 18");
`;

/**
 *
 * @param {Token} token
 * @returns
 */
export async function createShockedCondition(token) {
    if (!token) return;

    return {
        effectData: {
            label: game.hm3.enums.Condition.SHOCKED,
            token,
            icon: SHOCKED_ICON,
            type: 'GameTime',
            seconds: INDEFINITE,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO(token)}, onTurnStart: {script: ON_TURN_START_MACRO(token)}}}
        },
        changes: [],
        options: {unique: true}
    };
}
