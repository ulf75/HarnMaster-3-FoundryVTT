const PRONE = 'Prone';

if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];

let dialogEditor = new Dialog({
    title: 'Prone',
    buttons: {
        prone: {
            label: PRONE,
            callback: async () => {
                game.hm3.macros.createCondition(token, PRONE);
                dialogEditor.render(true);
            }
        },

        rise: {
            label: `Rise`,
            callback: async () => {
                game.hm3.macros.getActiveEffect(token, PRONE, true)?.delete();
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
