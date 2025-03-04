const UNCONSCIOUS = 'Unconscious';
const UNCONSCIOUS_ICON = 'systems/hm3/images/icons/svg/shock.svg';
const SHOCKED = 'Shocked';
const MINUTE = 60;

/**
 *
 * @param {Token} token
 * @returns
 */
export async function createUnconsciousCondition(token) {
    if (!token) return;

    const ON_CREATE_MACRO = `const token = canvas.tokens.get('${token.id}');
console.log('HM3 | Combatant ' + token.name + ' fails the SHOCK roll and gets unconscious.');
await token.combatant.update({defeated: true});
await game.hm3.GmSays("Overwhelmed by pain, blood loss, and exhaustion, <b>" + token.name + "</b> collapses unconscious onto the battlefield, falling <b>Prone</b> amidst the chaos.", "Combat 14");`;

    // On disable (regain consciousness), make a last SHOCK roll (SKILLS 22, COMBAT 14)
    const ON_DISABLE_MACRO = `const token = canvas.tokens.get('${token.id}');
console.log('HM3 | Combatant ' + token.name + ' makes a last SHOCK roll.');
const ok = (await game.hm3.macros.shockRoll(false, token.actor)).isSuccess;
token.deleteCondition('${UNCONSCIOUS}');
if (ok) {
    // Combatant is back
    console.log('HM3 | Combatant ' + token.name + ' is back.');
    await token.combatant.update({defeated: false});
    await game.hm3.GmSays("<b>" + token.name + "</b> regains consciousness and resumes functioning normally.", "Combat 14");
} else {
    // Combatant is now SHOCKED
    console.log('HM3 | Combatant ' + token.name + ' is now SHOCKED.');
    await game.hm3.macros.createCondition(token, '${SHOCKED}');
    const dateTime = SimpleCalendar?.api?.currentDateTimeDisplay();
    await game.hm3.macros.createInjury({token, name: 'Shock', subType: 'shock', healRate: 4, notes: 'Started: ' + dateTime?.date + ' - ' + dateTime?.time});
    await game.hm3.GmSays("<b>" + token.name + "</b> is in <b>Shock</b> and displays a variety of symptoms including pallor, cold sweats, weakness, nausea, thirst, and groaning. <b>" + token.name + "</b> is incoherent and gazes helplessly at the injuries.", "Combat 14");
}`;

    return {
        effectData: {
            label: UNCONSCIOUS,
            token,
            icon: UNCONSCIOUS_ICON,
            type: 'GameTime',
            seconds: game.hm3.macros.d6(2) * MINUTE, // 2d6 minutes
            flags: {
                effectmacro: {onCreate: {script: ON_CREATE_MACRO}, onDisable: {script: ON_DISABLE_MACRO}}
            }
        },
        changes: [],
        options: {unique: true}
    };
}

export function getOnTurnStartMacro(token, effect) {
    // If in combat, make a SHOCK roll each turn (SKILLS 22, COMBAT 14)
    return `const token = canvas.tokens.get('${token.id}');
console.log('HM3 | Combatant ' + token.name + ' makes a SHOCK roll to regain consciousness.');
await game.hm3.GmSays("<b>" + token.name + "</b> needs a successful shock roll to regain consciousness.", "Combat 14");
const success = (await game.hm3.macros.shockRoll(false, token.actor)).isSuccess;
if (success) {
    // Combatant regains consciousness
    console.log('HM3 | Combatant ' + token.name + ' regains consciousness.');
    await game.hm3.GmSays("<b>" + token.name + "</b> regains consciousness and starts coming back to full senses, though stability remains uncertain. Another <b>Shock Roll</b> is needed.", "Combat 14");
    token.disableCondition('${UNCONSCIOUS}', 500); // postpone a bit
} else {
    // Combatant stays unconscious
    console.log('HM3 | Combatant ' + token.name + ' stays unconscious.');
    await game.hm3.GmSays("<b>" + token.name + "</b> stays unconscious. <b>Turn ends.</b>", "Combat 14");
    await game.combats.active.nextTurn(1000); // delay so that other hooks are executed first
}`;
}
