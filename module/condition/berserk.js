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

    const ON_CREATE_MACRO = `const token = canvas.tokens.get('${token.id}');
console.log('HM3 | Combatant ' + token.name + ' becomes berserk.');
//await ChatMessage.create({
//    speaker,
//    content:
//        '<div class="chat-card fluff"><p>You are lying on the floor. Getting up takes <b>one action</b>.</p><p><b>All</b> opponents gain +20 on <b>all</b> attack and defense rolls against you.</p></div>'
//});`;

    return {
        effectData: {
            label: BERSERK,
            token,
            icon: BERSERK_ICON,
            type: 'GameTime',
            seconds: INDEFINITE,
            flags: {effectmacro: {onCreate: {script: ON_CREATE_MACRO}}}
        },
        changes: [{key: 'eph.meleeAMLMod', mode: 2, priority: null, value: '20'}],
        options: {unique: true}
    };
}
