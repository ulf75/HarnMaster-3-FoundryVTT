(async () => {
    const combatant = triggerArgs[0];
    const tokenDoc = canvas.scene.tokens.get(combatant.tokenId);
    const actor = tokenDoc.baseActor;
    const ownership = actor.ownership;
    const loggedInPlayers = game.users.filter((user) => user.active && !user.isGM);

    for (let u of loggedInPlayers) {
        const o = ownership[u.id] || 0;
        console.log('hm3 | Player ' + u.name + ' has ownership ' + o + ' of the actor ' + actor.name);
        if (o < 1) {
            console.log(
                'hm3 | User ' + u.name + ' does not have limited ownership or higher of the actor ' + actor.name + '. Will be changed to 1 (limited).'
            );
            ownership[u.id] = 1;
            await actor.update({'ownership': ownership}, {diff: false, recursive: false, noHook: true});
        }
    }

    // console.log('hm3', triggerArgs, combatant, tokenDoc, actor, ownership, loggedInPlayers);
})();
