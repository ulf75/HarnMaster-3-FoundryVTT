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

const GRAVE_ROT = 'Grave Rot';
const GRAVE_ROT_ICON = 'systems/hm3/images/icons/svg/arm-bandage.svg';
const CONTAGION_INDEX = 4;

if (triggerArgs[3].effectiveImpact > 0) {
    const victimActor = triggerArgs[0];

    // only friendly tokens are affected
    const friendlyTokens = macros.getSpecificTokens({friendly: true});

    console.info(`${GRAVE_ROT} from ${macroActor.name} to ${victimActor.name}`);

    // make a secret roll against CI x END
    const save = macros.HM100Check(CONTAGION_INDEX * victimActor.system.endurance);
    const d100 = await macros.rollAsync('1d100');
    if (d100 > save) {
        await macros.createActiveEffect(
            {
                owner: victimActor,
                label: GRAVE_ROT,
                type: 'GameTime',
                postpone: await macros.rollAsync(`2d6 * ${game.hm3.CONST.TIME.HOUR}`),
                seconds: 1,
                icon: GRAVE_ROT_ICON
            },
            [],
            {unique: true}
        );
    }
}
