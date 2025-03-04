// This is a special state of battle frenzy. Any character who enters this mode must take the most
// aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike.
// Further Initiative rolls are ignored until the battle ends. (COMBAT 16)
const BERSERK = 'Berserk';
const BERSERK_ICON = 'systems/hm3/images/icons/svg/enrage.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

/**
 *
 * @param {Token} token
 * @returns
 */
export async function createBerserkCondition(token) {
    if (!token) return;

    const ON_CREATE_MACRO = `
const token = canvas.tokens.get('${token.id}');
console.log('HM3 | Combatant ' + token.name + ' becomes berserk.');
await game.hm3.GmSays("<b>" + token.name + "</b> enters <b>Berserk Mode</b>, and <b>Must</b> take the most aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike. Further Initiative rolls are ignored until the battle ends.", "Combat 18");
`;

    const ON_TURN_START_MACRO = `
const token = canvas.tokens.get('${token.id}');
await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Berserk Mode</b>, and <b>Must</b> take the most aggressive action available for Attack or Defense, adding 20 to EML to Attack or Counterstrike. Further Initiative rolls are ignored until the battle ends.", "Combat 18");
`;

    return {
        effectData: {
            label: BERSERK,
            token,
            icon: BERSERK_ICON,
            type: 'GameTime',
            seconds: INDEFINITE,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onTurnStart: {script: ON_TURN_START_MACRO}}}
        },
        changes: [{key: 'eph.meleeAMLMod', mode: 2, priority: null, value: '20'}],
        options: {unique: true}
    };
}
