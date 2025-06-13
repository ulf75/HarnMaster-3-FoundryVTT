(async () => {
    const groups = {
        'group1': [
            'S1dW6oJHOu5jlY2q',
            'CkKjZQsDdoclFncK',
            'FTiraUuJgNlKIBoy',
            'XBYxz7drjOM5LKnk',
            '9EThXxtZPio34zw9',
            'OsD3luRCZVfYkEIm'
        ],
        'group2': ['Gw5yK3JaWtbzCrkv', '0Aeu2UHjJvzLzmNA', 'aNXK5Ribm4A8kqmu', 'OsD3luRCZVfYkEIm']
    };
    const ownerships = {'inherit': -1, 'none': 0, 'limited': 1, 'observer': 2, 'owner': 3};

    const defaultNoteOwnership = {'default': -1, 'VumzzG6Cu3SwNvru': 3};

    const content = `<div>
<label for="d_ownership">Default:</label>
<select name="d_ownership" id="d_ownership">
<option value="inherit">Inherit</option>
<option value="none">None</option>
<option value="limited">Limited</option>
<option value="observer">Observer</option>
<option value="owner">Owner</option>
</select>
<div>
<label for="group">Choose a Group:</label>
<select name="group" id="group">
<option value="group1">Group 1</option>
<option value="group2">Group 2</option>
</select>
</div>
<div>
<label for="ownership">Choose an Ownership:</label>
<select name="ownership" id="ownership">
<option value="default">Default</option>
<option value="inherit">Inherit</option>
<option value="none">None</option>
<option value="limited">Limited</option>
<option value="observer">Observer</option>
<option value="owner">Owner</option>
</select>
</div>`;

    let confirmed = false;
    new Dialog({
        title: 'Set Ownership',
        content: content,
        buttons: {
            create: {label: 'Set', callback: () => (confirmed = true)},
            cancel: {label: 'Cancel', callback: () => (confirmed = false)}
        },
        default: 'create',

        close: (html) => {
            (async () => {
                if (confirmed) {
                    let d_ownership = html.find('#d_ownership')[0];
                    d_ownership = d_ownership.options[d_ownership.selectedIndex].value;
                    let group = html.find('#group')[0];
                    group = group.options[group.selectedIndex].value;
                    let ownership = html.find('#ownership')[0];
                    ownership = ownership.options[ownership.selectedIndex].value;

                    // console.info(game.users.get(groups[group][0]), group, ownership, ownerships[ownership], d_ownership, ownerships[d_ownership]);

                    for (let n of canvas.notes.controlled) {
                        const doc = n.document;
                        const journal = game.journal.get(doc.entryId);
                        const page = journal.pages.get(doc.pageId);

                        const os = {'default': ownerships[d_ownership], 'VumzzG6Cu3SwNvru': 3};
                        for (let u of groups[group]) {
                            if (ownerships[ownership] !== undefined) {
                                os[u] = ownerships[ownership];
                            }
                        }
                        console.info(os, doc);

                        if (page) {
                            page.ownership = foundry.utils.deepClone(os);
                            await page.update(
                                {'ownership': page.ownership},
                                {diff: false, recursive: false, noHook: true}
                            );
                            await journal.update();
                            console.info(page);
                        } else if (journal) {
                            journal.ownership = foundry.utils.deepClone(os);
                            await journal.update(
                                {'ownership': journal.ownership},
                                {diff: false, recursive: false, noHook: true}
                            );
                            // await journal.update();
                            console.info(journal);
                        }
                    }

                    for (let t of canvas.tokens.controlled) {
                        const doc = t.document;
                        const A = doc.baseActor; // game.actors.get(doc.actorId);

                        const os = {'default': ownerships[d_ownership], 'VumzzG6Cu3SwNvru': 3};
                        for (let u of groups[group]) {
                            if (ownerships[ownership] !== undefined) {
                                os[u] = ownerships[ownership];
                            } else {
                                delete os[u];
                            }
                        }
                        console.info(os);

                        A.ownership = foundry.utils.deepClone(os);
                        await A.update(
                            {'ownership': foundry.utils.deepClone(os)},
                            {diff: false, recursive: false, noHook: true}
                        );
                    }
                }
            })();
        }
    }).render(true);
})();
