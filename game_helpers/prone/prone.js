if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];

let dialogEditor = new Dialog({
    title: game.hm3.enums.Condition.PRONE,
    buttons: {
        prone: {
            label: game.hm3.enums.Condition.PRONE,
            callback: async () => {
                token.addCondition(game.hm3.enums.Condition.PRONE);
                dialogEditor.render(true);
            }
        },

        rise: {
            label: `Rise`,
            callback: async () => {
                token.getCondition(game.hm3.enums.Condition.PRONE)?.delete();
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
