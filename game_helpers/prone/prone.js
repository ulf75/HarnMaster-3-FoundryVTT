let dialogEditor = new Dialog({
    title: game.hm3.enums.Condition.PRONE,
    buttons: {
        prone: {
            label: game.hm3.enums.Condition.PRONE,
            callback: async () => {
                if (canvas.tokens.controlled.length !== 1) {
                    ui.notifications.error('Please select ONE token!');
                } else {
                    const token = canvas.tokens.controlled[0];
                    token.addCondition(game.hm3.enums.Condition.PRONE);
                }
                dialogEditor.render(true);
            }
        },

        rise: {
            label: `Rise`,
            callback: async () => {
                if (canvas.tokens.controlled.length !== 1) {
                    ui.notifications.error('Please select ONE token!');
                } else {
                    const token = canvas.tokens.controlled[0];
                    token.getCondition(game.hm3.enums.Condition.PRONE)?.delete();
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
