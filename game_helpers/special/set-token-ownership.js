(async () => {
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.warn('Please select at least one token to set ownership for.');
        return;
    }

    let cnt = 0;
    for (let token of canvas.tokens.controlled) {
        const tokenDoc = token.document;
        const actor = tokenDoc.baseActor;
        const ownership = actor.ownership;

        const loggedInPlayers = game.users.filter((user) => user.active && !user.isGM);
        for (let player of loggedInPlayers) {
            const o = ownership[player.id] || 0;
            console.log(`HM3 | Player ${player.name} has ownership ${o} of the actor ${actor.name}.`);
            if (o < 1) {
                ui.notifications.info(
                    `Player ${player.name} does not have limited ownership or higher of the actor ${actor.name}. Will be changed to 1 (limited).`
                );
                ownership[player.id] = 1;
                await actor.update({'ownership': ownership}, {diff: false, recursive: false, noHook: true});
                cnt++;
            }
        }
    }
    if (cnt === 0) ui.notifications.info('No ownership changes were made.');

    // console.log('hm3', triggerArgs, combatant, tokenDoc, actor, ownership, loggedInPlayers);
})();
