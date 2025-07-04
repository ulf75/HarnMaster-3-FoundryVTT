canvas.tokens.controlled.forEach((token) => {
    token.actor.items.forEach((item) => {
        if (item.type === game.hm3.ItemType.ARMORLOCATION) {
            item.delete();
        }
    });

    const updateData = {items: []};
    game.hm3.ActorHM3._createDefaultHumanoidLocations(updateData.items, false);
    token.actor.updateSource(updateData);
});
