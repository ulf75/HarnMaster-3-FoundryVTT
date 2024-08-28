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

    const stops = [];
    macroTokens.forEach((t) => {
        console.log('to: ' + t.name);

        if (isFriendlyTokenMoving) {
            const stop = macros.pathIntersectsCircle({center: canvas.tokens.get(t.id).center, radius: RADIUS}, {p1, p2}, true);

            console.log(stop);
            if (!!stop) stops.push(stop);
        }
    });

    if (stops.length > 0 && !game.paused && !macros.hasActiveEffect(token.actor, STENCH_OF_CORRUPTION)) {
        game.togglePause(true);
        stops.sort((a, b) => (p1.x - a.x) ** 2 + (p1.y - a.y) ** 2 - ((p1.x - b.x) ** 2 + (p1.y - b.y) ** 2));
        const tl = canvas.grid.getTopLeftPoint(stops[0]);
        const pos = token.getSnappedPosition(stops[0], {mode: CONST.GRID_SNAPPING_MODES.CENTER});
        await canvas.tokens.get(token.id).document.update(pos);
        await macros.createActiveEffect(
            {
                owner: token.actor,
                label: STENCH_OF_CORRUPTION,
                type: 'GameTime',
                seconds: 20 * 60,
                icon: 'systems/hm3/images/icons/svg/distraction.svg'
            },
            {selfDestroy: true}
        );
    }
}
