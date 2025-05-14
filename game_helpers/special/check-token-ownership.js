(async () => {
    const combatant = triggerArgs[0];
    const tokenDoc = canvas.scene.tokens.get(combatant.tokenId);
    const actor = tokenDoc.baseActor;
    const ownership = actor.ownership;
    const loggedInPlayers = game.users.filter((user) => user.active && !user.isGM);

    combatant.rollInitiative();

    for (let player of loggedInPlayers) {
        const o = ownership[player.id] || 0;
        console.log(`HM3 | Player ${player.name} has ownership ${o} of the actor ${actor.name}.`);
        if (o < 1) {
            ui.notifications.info(
                `Player ${player.name} does not have limited ownership or higher of the actor ${actor.name}. Will be changed to 1 (limited).`
            );
            ownership[player.id] = 1;
            await actor.update({'ownership': ownership}, {diff: false, recursive: false, noHook: true});
        }
    }

    // console.log('hm3', triggerArgs, combatant, tokenDoc, actor, ownership, loggedInPlayers);
})();
