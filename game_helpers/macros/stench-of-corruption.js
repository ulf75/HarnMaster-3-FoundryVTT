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

const STENCH_OF_CORRUPTION = 'Stench of Corruption';
const STENCH_OF_CORRUPTION_ICON = 'systems/hm3/images/icons/svg/distraction.svg';
const RADIUS = 11; // [ft]

const p1 = canvas.tokens.get(triggerArgs[0].id).center;
const p2a = canvas.grid.getCenterPoint(triggerArgs[1]);
const p2 = canvas.grid.getSnappedPoint(triggerArgs[1], {mode: CONST.GRID_SNAPPING_MODES.CENTER});
const p2b = triggerArgs[1];

// only movement is interesting
if (p2.x && p2.y && p1.x !== p2.x && p1.y !== p2.y) {
    console.info(`${STENCH_OF_CORRUPTION} from a: ` + macroActor.name);

    // only friendly tokens are affected
    const friendlyTokens = macros.getSpecificTokens({friendly: true});

    const isMacroTokenMoving = !!macroTokens.find((t) => t.id === token.id);
    const isFriendlyTokenMoving = !!friendlyTokens.find((t) => t.id === token.id);

    if (!(isMacroTokenMoving || isFriendlyTokenMoving)) return;

    const stops = [];
    if (isFriendlyTokenMoving) {
        console.info('to: ' + token.name);
        victimToken = token;
        const stop = macros.pathIntersectsCircle(
            {center: canvas.tokens.get(token.id).center, radius: RADIUS},
            {p1, p2},
            true
        );
        if (!!stop) stops.push({stop, victimToken: token});
    } else {
        friendlyTokens.forEach((t) => {
            console.info('to: ' + t.name);
            const stop = macros.pathIntersectsCircle(
                {center: canvas.tokens.get(t.id).center, radius: RADIUS},
                {p1, p2},
                true
            );
            if (!!stop) stops.push({stop, victimToken: t});
        });
    }

    if (stops.length > 0 && !game.paused && !macros.hasActiveEffect(token, STENCH_OF_CORRUPTION)) {
        game.togglePause(true, true);
        if (isFriendlyTokenMoving) {
            stops.sort(
                (a, b) =>
                    (p1.x - a.stop.x) ** 2 + (p1.y - a.stop.y) ** 2 - ((p1.x - b.stop.x) ** 2 + (p1.y - b.stop.y) ** 2)
            );
            const tl = canvas.grid.getTopLeftPoint(stops[0].stop);
            const pos = token.getSnappedPosition(stops[0].stop, {mode: CONST.GRID_SNAPPING_MODES.CENTER});
            await token.document.update(pos);
        }

        const victimToken = stops[0].victimToken;
        const victimActor = victimToken.actor;
        const result = await macros.testAbilityD100RollAlt({
            ability: 'will',
            noDialog: true,
            myActor: victimActor,
            multiplier: 4,
            private: true,
            fluff: 'A foul stench of death and decay creeps into your nostrils, forcing you to fight the urge to vomit.',
            fluffResult: {
                CS: `Fortunately, the disgusting stench can't do you much harm.`,
                MS: 'The disgusting stench overwhelms your senses.',
                MF: 'The brutal stench heavily overwhelms your senses.',
                CF: 'The foul odor triggers violent retching, rendering you almost incapable of action.'
            }
        });

        let seconds, value;
        if (result.isSuccess && result.isCritical) {
            // critical success - all good!
            seconds = 10 * game.hm3.CONST.TIME.MINUTE;
            value = 0;
        } else if (result.isSuccess && !result.isCritical) {
            // marginal success
            seconds = await macros.rollAsync(`4d6 * ${game.hm3.CONST.TIME.MINUTE}`);
            value = -2;
        } else if (!result.isSuccess && !result.isCritical) {
            // marginal failure
            seconds = await macros.rollAsync(`8d6 * ${game.hm3.CONST.TIME.MINUTE}`);
            value = -3;
        } else {
            // critical failure
            seconds = await macros.rollAsync(`16d6 * ${game.hm3.CONST.TIME.MINUTE}`);
            value = -3;
            await macros.createActiveEffect(
                {
                    token: victimToken,
                    label: 'Violent Retching',
                    type: 'GameTime',
                    seconds: 20 * game.hm3.CONST.TIME.SECOND,
                    icon: STENCH_OF_CORRUPTION_ICON
                },
                [{key: 'universalPenalty', value: 4}],
                {selfDestroy: true, unique: true}
            );
        }

        await macros.createActiveEffect(
            {
                token: victimToken,
                label: STENCH_OF_CORRUPTION,
                type: 'GameTime',
                seconds,
                icon: STENCH_OF_CORRUPTION_ICON
            },
            [{key: 'eph.smell', value}],
            {selfDestroy: true, unique: true}
        );
    }
}
