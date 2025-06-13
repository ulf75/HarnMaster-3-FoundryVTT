(async () => {
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.warn('Please select at least one token to set ownership for.');
        return;
    }

    let cnt = 0;
    for (let n of canvas.notes.controlled) {
        const doc = n.document;
        const journal = game.journal.get(doc.entryId);
        const page = journal.pages.get(doc.pageId);

        const loggedInPlayers = game.users.filter((user) => user.active && !user.isGM);
        for (let player of loggedInPlayers) {
            if (page) {
                const o = page.ownership[player.id] || 0;
                console.info(`HM3 | Player ${player.name} has ownership ${o} of the page ${page.name}.`);
                if (o < 2) {
                    ui.notifications.info(
                        `Player ${player.name} does not have observer ownership or higher of the page ${page.name}. Will be changed to 2 (observer).`
                    );
                    page.ownership[player.id] = 2;
                    await page.update({'ownership': page.ownership}, {diff: false, recursive: false, noHook: true});
                    await journal.update();
                    console.info(page);
                }
            } else if (journal) {
                const o = journal.ownership[player.id] || 0;
                console.info(`HM3 | Player ${player.name} has ownership ${o} of the journal ${journal.name}.`);
                if (o < 2) {
                    ui.notifications.info(
                        `Player ${player.name} does not have observer ownership or higher of the journal ${journal.name}. Will be changed to 2 (observer).`
                    );
                    journal.ownership[player.id] = 2;
                    await journal.update(
                        {'ownership': journal.ownership},
                        {diff: false, recursive: false, noHook: true}
                    );
                    // await journal.update();
                    console.info(journal);
                }
            }

            cnt++;
        }
    }
    if (cnt === 0) ui.notifications.info('No ownership changes were made.');

    // console.info('hm3', triggerArgs, combatant, tokenDoc, actor, ownership, loggedInPlayers);
})();
