let dialogEditor = new Dialog({
    title: game.hm3.Condition.CLOSE_MODE,
    buttons: {
        closemode: {
            label: game.hm3.Condition.CLOSE_MODE,
            callback: async () => {
                canvas.tokens.controlled.forEach((token) => {
                    token.addCondition(game.hm3.Condition.CLOSE_MODE);
                });
                dialogEditor.render(true);
            }
        },

        none: {
            label: `None`,
            callback: async () => {
                canvas.tokens.controlled.forEach((token) => {
                    token.deleteCondition(game.hm3.Condition.CLOSE_MODE);
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
