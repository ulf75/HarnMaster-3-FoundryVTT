const sizeTable = game.tables.getName('Random Size Factor');

for (let t of canvas.tokens.controlled) {
    const sizeRoll = new Roll('1d100');
    const sizeDraw = await sizeTable.draw({roll: sizeRoll, recursive: true, displayChat: false});
    const size = Number(sizeDraw.results[0].text);
    const ini = t.actor.items.find((x) => x.name === 'Initiative');
    const from = ini.system.masteryLevel;

    await ini.update({'system.masteryLevel': Math.round(from * size)});

    ui.notifications.info(`${t.name}'s Initiative: ${from} to ${from * size}`);
}
