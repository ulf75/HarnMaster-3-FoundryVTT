let dialogEditor = new Dialog({
    title: game.hm3.enums.Condition.SECONDARY_HAND,
    buttons: {
        SECONDARY_HAND: {
            label: game.hm3.enums.Condition.SECONDARY_HAND,
            callback: async () => {
                if (canvas.tokens.controlled.length !== 1) {
                    ui.notifications.error('Please select ONE token!');
                } else {
                    const token = canvas.tokens.controlled[0];
                    token.addCondition(game.hm3.enums.Condition.SECONDARY_HAND);
                }
                dialogEditor.render(true);
            }
        },

        rise: {
            label: `None`,
            callback: async () => {
                if (canvas.tokens.controlled.length !== 1) {
                    ui.notifications.error('Please select ONE token!');
                } else {
                    const token = canvas.tokens.controlled[0];
                    token.getCondition(game.hm3.enums.Condition.SECONDARY_HAND)?.delete();
                }
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
