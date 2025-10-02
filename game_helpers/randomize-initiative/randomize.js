const sizeTable = game.tables.getName('Random Size Factor');

for (let t of canvas?.tokens?.controlled) {
    const sizeRoll = hm3.macros.rollObject('1d100');
    const sizeDraw = await sizeTable.draw({roll: sizeRoll, recursive: true, displayChat: false});
    const size = Number(sizeDraw.results[0].text);
    const ini = t.actor.items.find((x) => x.name === 'Initiative');
    const from = ini.system.ML;

    await ini.update({'system.masteryLevel': Math.round(from * size)});

    ui.notifications?.info(`${t.name}'s Initiative: ${from} to ${from * size}`);
}
