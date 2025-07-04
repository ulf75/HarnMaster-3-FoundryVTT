let dialogEditor = new Dialog({
    title: 'New Hit Locations',
    buttons: {
        humanoid_full: {
            label: 'Humanoid full',
            callback: async () => {
                canvas.tokens.controlled.forEach((token) => {
                    token.actor.items.forEach((item) => {
                        if (item.type === game.hm3.ItemType.ARMORLOCATION) {
                            item.delete();
                        }
                    });

                    const updateData = {items: []};
                    game.hm3.ActorHM3._createDefaultHumanoidLocations(updateData.items, false);
                    token.actor.update(updateData);
                    ui.notifications.info(`${token.name} was changed to Humanoid, standard hit locations.`, {
                        permanent: true
                    });
                });
                dialogEditor.render(true);
            }
        },

        humanoid_simplified: {
            label: `Humanoid simplified`,
            callback: async () => {
                canvas.tokens.controlled.forEach((token) => {
                    token.actor.items.forEach((item) => {
                        if (item.type === game.hm3.ItemType.ARMORLOCATION) {
                            item.delete();
                        }
                    });

                    const updateData = {items: []};
                    game.hm3.ActorHM3._createSimpleHumanoidLocations(updateData.items);
                    token.actor.update(updateData);
                    ui.notifications.info(`${token.name} was changed to Humanoid, simplified hit locations.`, {
                        permanent: true
                    });
                });
                dialogEditor.render(true);
            }
        },

        horse: {
            label: `Horse`,
            callback: async () => {
                canvas.tokens.controlled.forEach((token) => {
                    token.actor.items.forEach((item) => {
                        if (item.type === game.hm3.ItemType.ARMORLOCATION) {
                            item.delete();
                        }
                    });

                    const updateData = {items: []};
                    game.hm3.ActorHM3._createHorseLocations(updateData.items);
                    token.actor.update(updateData);
                    ui.notifications.info(`${token.name} was changed to Horse hit locations.`, {permanent: true});
                });
                dialogEditor.render(true);
            }
        },

        close: {
            label: `Exit`
        }
    },
    default: 'close',
    close: () => {}
});

dialogEditor.render(true);
