(async () => {
    if (canvas.notes.controlled.length === 0) {
        ui.notifications.warn('Please select at least one note to set ownership for.');
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
                if (o < 1) {
                    ui.notifications.info(
                        `Player ${player.name} does not have limited ownership or higher of the page ${page.name}. Will be changed to 1 (limited).`
                    );
                    page.ownership[player.id] = 1;
                    await page.update({'ownership': page.ownership}, {diff: false, recursive: false, noHook: true});
                    await journal.update();
                    console.info(page);
                }
            } else if (journal) {
                const o = journal.ownership[player.id] || 0;
                console.info(`HM3 | Player ${player.name} has ownership ${o} of the journal ${journal.name}.`);
                if (o < 1) {
                    ui.notifications.info(
                        `Player ${player.name} does not have limited ownership or higher of the journal ${journal.name}. Will be changed to 1 (limited).`
                    );
                    journal.ownership[player.id] = 1;
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
