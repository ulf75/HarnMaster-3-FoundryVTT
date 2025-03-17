const DYING_ICON = 'systems/hm3/images/icons/svg/daemon-skull.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

/**
 *
 * @param {Token} token
 * @returns
 */
export async function createDyingCondition(token) {
    if (!token) return;

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
await game.hm3.GmSays("<b>" + token.name + "</b> Ulf is unconscious due to the <b>Mortal Wound</b> and is <b>Dying</b>. Life-saving measures should be initiated as quickly as possible.", "Combat 14");
const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
if (!unconscious) await token.addCondition(game.hm3.enums.Condition.UNCONSCIOUS);
await token.combatant?.delete();
`;

    return {
        effectData: {
            label: game.hm3.enums.Condition.DYING,
            token,
            icon: DYING_ICON,
            type: 'GameTime',
            seconds: INDEFINITE,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO}}}
        },
        changes: [],
        options: {unique: true}
    };
}
