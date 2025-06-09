let dialogEditor = new Dialog({
    title: game.hm3.Condition.SECONDARY_HAND,
    buttons: {
        second: {
            label: game.hm3.Condition.SECONDARY_HAND,
            callback: async () => {
                canvas.tokens.controlled.forEach((token) => {
                    token.addCondition(game.hm3.Condition.SECONDARY_HAND);
                });
                dialogEditor.render(true);
            }
        },

        none: {
            label: `None`,
            callback: async () => {
                canvas.tokens.controlled.forEach((token) => {
                    token.deleteCondition(game.hm3.Condition.SECONDARY_HAND);
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
