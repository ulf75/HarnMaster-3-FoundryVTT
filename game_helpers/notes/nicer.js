const ICON_SIZE = 75; // >=32
const FONT_SIZE = 32; // >=32
const SCROLL = 'assets/player/Scroll.png';

for (let n of canvas.notes.controlled) {
    const doc = n.document;
    const journal = game.journal.get(doc.entryId);
    console.info(doc);
    const page = journal.pages.get(doc.pageId);
    console.info(page);

    if (!isNaN(doc.text) && !isNaN(parseFloat(doc.text))) {
        const num = Number(doc.text);
        console.info(doc);
        let svg = '';

        if (page.name.includes('Cave Ceiling'))
            svg = `systems/hm3/images/icons/hm3/ceiling/${('0' + num).slice(-2)}-cave.svg`;
        else if (page.name.includes('Dome Ceiling'))
            svg = `systems/hm3/images/icons/hm3/ceiling/${('0' + num).slice(-2)}-dome.svg`;
        else if (page.name.includes('Flat Ceiling'))
            svg = `systems/hm3/images/icons/hm3/ceiling/${('0' + num).slice(-2)}-flat.svg`;
        else if (page.name.includes('Spot Elevation'))
            svg = `systems/hm3/images/icons/hm3/elevation/${('0' + num).slice(-2)}.svg`;
        else if (page.name.includes('Water Depth'))
            svg = `systems/hm3/images/icons/hm3/water-depth/${('0' + num).slice(-2)}.svg`;
        else svg = `systems/hm3/images/icons/notes/${('0' + num).slice(-2)}.svg`;

        await doc.update({
            'texture.src': svg
        });
    } else {
        await doc.update({
            'texture.src': SCROLL
        });
    }

    await doc.update({
        'fontFamily': 'Amasis MT Medium',
        'fontSize': FONT_SIZE,
        'iconSize': ICON_SIZE
    });
    if (page)
        await doc.update({
            'text': page.name
        });
}
