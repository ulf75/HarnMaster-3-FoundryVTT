let dialogEditor = new Dialog({
    title: game.hm3.Condition.PRONE,
    buttons: {
        prone: {
            label: game.hm3.Condition.PRONE,
            callback: async () => {
                canvas.tokens.controlled.forEach((token) => {
                    token.addCondition(game.hm3.Condition.PRONE);
                });
                dialogEditor.render(true);
            }
        },

        rise: {
            label: `Rise`,
            callback: async () => {
                canvas.tokens.controlled.forEach((token) => {
                    token.getCondition(game.hm3.Condition.PRONE)?.delete();
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
