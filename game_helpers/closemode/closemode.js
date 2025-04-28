if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];

let dialogEditor = new Dialog({
    title: game.hm3.enums.Condition.CLOSE_MODE,
    buttons: {
        CLOSE_MODE: {
            label: game.hm3.enums.Condition.CLOSE_MODE,
            callback: async () => {
                await token.addCondition(game.hm3.enums.Condition.CLOSE_MODE);
                dialogEditor.render(true);
            }
        },

        rise: {
            label: `None`,
            callback: async () => {
                token.getCondition(game.hm3.enums.Condition.CLOSE_MODE)?.delete();
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
