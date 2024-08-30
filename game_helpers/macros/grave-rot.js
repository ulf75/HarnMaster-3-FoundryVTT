// speaker        : The speaker of the token which is changed
// actor          : The actor of the token which is changed
// token          : The token which is changed
// character      :
// scope          :
// macroActor     :
// macroTokens    :
// allOtherTokens :
// triggerArgs    : The original arguments from the hook
// macros         : Short for game.hm3.macros

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const GRAVE_ROT = 'Grave Rot';
const GRAVE_ROT_ICON = 'systems/hm3/images/icons/svg/arm-bandage.svg';

console.log('Grave Rot Macro start');

console.log(speaker);
console.log(actor);
console.log(token);
console.log(triggerArgs[2].impact);

console.log('Grave Rot Macro end');
