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

const STENCH_OF_CORRUPTION = 'Stench of Corruption';
const STENCH_OF_CORRUPTION_ICON = 'systems/hm3/images/icons/svg/distraction.svg';
const RADIUS = 11; // [ft]

const p1 = canvas.tokens.get(triggerArgs[0].id).center;
const p2a = canvas.grid.getCenterPoint(triggerArgs[1]);
const p2 = canvas.grid.getSnappedPoint(triggerArgs[1], {mode: CONST.GRID_SNAPPING_MODES.CENTER});
const p2b = triggerArgs[1];

// only movement is interesting
if (p2.x && p2.y && p1.x !== p2.x && p1.y !== p2.y) {
    console.log(`${STENCH_OF_CORRUPTION} from a: ` + macroActor.name);

    // only friendly tokens are affected
    const friendlyTokens = macros.getSpecificTokens({friendly: true});

    const isMacroTokenMoving = !!macroTokens.find((t) => t.id === token.id);
    const isFriendlyTokenMoving = !!friendlyTokens.find((t) => t.id === token.id);

    if (!(isMacroTokenMoving || isFriendlyTokenMoving)) return;

    const stops = [];
    if (isFriendlyTokenMoving) {
        console.log('to: ' + token.name);
        victimToken = token;
        const stop = macros.pathIntersectsCircle({center: canvas.tokens.get(token.id).center, radius: RADIUS}, {p1, p2}, true);
        if (!!stop) stops.push({stop, victimToken: token});
    } else {
        friendlyTokens.forEach((t) => {
            console.log('to: ' + t.name);
            const stop = macros.pathIntersectsCircle({center: canvas.tokens.get(t.id).center, radius: RADIUS}, {p1, p2}, true);
            if (!!stop) stops.push({stop, victimToken: t});
        });
    }

    if (stops.length > 0 && !game.paused && !macros.hasActiveEffect(token.actor, STENCH_OF_CORRUPTION)) {
        game.togglePause(true);
        stops.sort((a, b) => (p1.x - a.stop.x) ** 2 + (p1.y - a.stop.y) ** 2 - ((p1.x - b.stop.x) ** 2 + (p1.y - b.stop.y) ** 2));
        const tl = canvas.grid.getTopLeftPoint(stops[0].stop);
        const pos = token.getSnappedPosition(stops[0].stop, {mode: CONST.GRID_SNAPPING_MODES.CENTER});
        await token.document.update(pos);

        const victimActor = stops[0].victimToken.actor;
        const result = await macros.testAbilityD100RollAlt({ability: 'will', noDialog: true, myActor: victimActor, multiplier: 4});

        let seconds, value, addon;
        if (result.isSuccess && result.isCritical) {
            // critical success - all good!
            seconds = 10 * MINUTE;
            value = 0;
            addon = ' (CS)';
        } else if (result.isSuccess && !result.isCritical) {
            // marginal success
            seconds = macros.d6(4) * MINUTE;
            value = -2;
            addon = ' (MS)';
        } else if (!result.isSuccess && !result.isCritical) {
            // marginal failure
            seconds = macros.d6(8) * MINUTE;
            value = -4;
            addon = ' (MF)';
        } else {
            // critical failure
            seconds = macros.d6(16) * MINUTE;
            value = -4;
            addon = ' (CF)';
        }

        await macros.createActiveEffect(
            {
                owner: victimActor,
                label: STENCH_OF_CORRUPTION + addon,
                type: 'GameTime',
                seconds,
                icon: STENCH_OF_CORRUPTION_ICON
            },
            [{key: 'smell', value}],
            {selfDestroy: true}
        );
    }
}
